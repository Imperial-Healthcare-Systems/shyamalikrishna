import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Admin API — ported from the Supabase Edge Function (Deno) to a Next route
 * handler. The route map below is unchanged from the original; only the
 * runtime preamble and the request entrypoint differ.
 *
 * The service-role key is read from a server-only env var and never reaches
 * the browser, which is the main reason this moved in-process.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Built lazily: creating the service-role client at module scope would throw
// during `next build`, which collects route metadata without runtime secrets.
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Admin API is not configured: set SUPABASE_SERVICE_ROLE_KEY.');
    }
    _supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabase;
}

// Lets the ~45 handler bodies below keep using a bare `supabase.` reference.
const supabase = new Proxy({} as SupabaseClient, {
  get: (_t, prop) => (getSupabase() as any)[prop],
});

// No fallback: if ADMIN_PASSWORD is unset the login route fails closed
// rather than accepting a password baked into source control.
const adminPassword = () => process.env.ADMIN_PASSWORD || '';
const SESSION_TTL_HOURS = 12;
const RESUME_URL_TTL_SECONDS = 300;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Compare without leaking length or match position through timing.
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < Math.max(aBytes.length, bBytes.length); i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function createSession(ip: string, userAgent: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("admin_sessions")
    .insert({ token, expires_at: expiresAt, ip_address: ip, user_agent: userAgent });
  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return token;
}

async function validateSession(token: string): Promise<boolean> {
  if (!token) return false;
  const { data, error } = await supabase
    .from("admin_sessions")
    .select("token, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return false;
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("admin_sessions").delete().eq("token", token);
    return false;
  }
  return true;
}

async function destroySession(token: string): Promise<void> {
  if (!token) return;
  await supabase.from("admin_sessions").delete().eq("token", token);
}

async function logActivity(action: string, entityType: string, description: string) {
  try {
    await supabase
      .from("admin_activity")
      .insert({ action, entity_type: entityType, description });
  } catch (_e) {
    // best-effort logging
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

// Simple in-DB rate limiting for login attempts
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("admin_activity")
    .select("id", { count: "exact", head: true })
    .eq("action", "login_attempt")
    .eq("entity_type", ip)
    .gte("created_at", windowStart);
  const attempts = count || 0;
  const maxAttempts = 5;
  return { allowed: attempts < maxAttempts, remaining: Math.max(0, maxAttempts - attempts) };
}

const routes: Record<string, (req: Request, body: any, authed: boolean) => Promise<Response>> = {
  "/admin-api/login": async (req, body) => {
    const ip = getClientIp(req);
    const { allowed } = await checkRateLimit(ip);
    if (!allowed) {
      return json({ error: "Too many login attempts. Please try again later." }, 429);
    }
    const password = body?.password;
    if (!password) {
      await logActivity("login_attempt", ip, "Missing password");
      return json({ error: "Password is required." }, 400);
    }
    if (!adminPassword()) {
      await logActivity("login_attempt", ip, "ADMIN_PASSWORD not configured");
      return json({ error: "Admin login is not configured." }, 503);
    }
    if (timingSafeEqual(password, adminPassword())) {
      const token = await createSession(ip, req.headers.get("user-agent") || "");
      await logActivity("login", "auth", "Admin logged in");
      return json({ token, expires_in: SESSION_TTL_HOURS * 3600 });
    }
    await logActivity("login_attempt", ip, "Failed login attempt");
    return json({ error: "Invalid password." }, 401);
  },

  "/admin-api/logout": async (_req, _body) => {
    return json({ success: true });
  },

  "/admin-api/verify": async (_req, _body, authed) => {
    if (authed) return json({ valid: true });
    return json({ valid: false }, 401);
  },

  "/admin-api/dashboard": async (_req, _body) => {
    const [
      leadsResult,
      jobsResult,
      applicationsResult,
      activityResult,
      recentLeads,
      recentApplications,
      recentJobs
    ] = await Promise.all([
      supabase.from("leads").select("lead_type, status, created_at").eq("is_archived", false),
      supabase.from("jobs").select("status"),
      supabase.from("job_applications").select("status, created_at"),
      supabase.from("admin_activity").select("action, entity_type, description, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("leads").select("id, name, lead_type, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("job_applications").select("id, full_name, job_slug, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("jobs").select("id, title, status, published_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const leads = leadsResult.data || [];
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === "new").length;
    const leadTypeCounts: Record<string, number> = {};
    leads.forEach(l => { leadTypeCounts[l.lead_type] = (leadTypeCounts[l.lead_type] || 0) + 1; });

    const jobs = jobsResult.data || [];
    const openJobs = jobs.filter(j => j.status === "published").length;

    const applications = applicationsResult.data || [];
    const totalApplications = applications.length;

    return json({
      stats: {
        totalLeads,
        newLeads,
        openJobs,
        totalApplications,
        leadTypeCounts,
      },
      recentActivity: activityResult.data || [],
      recentLeads: recentLeads.data || [],
      recentApplications: recentApplications.data || [],
      recentJobs: recentJobs.data || [],
    });
  },

  "/admin-api/leads": async (req, _body) => {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const leadType = url.searchParams.get("lead_type") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("per_page") || "20");
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,product_name.ilike.%${search}%`);
    if (status && status !== "all") query = query.eq("status", status);
    if (leadType && leadType !== "all") query = query.eq("lead_type", leadType);

    query = query.range(offset, offset + perPage - 1);
    const { data, count, error } = await query;
    if (error) return json({ error: error.message }, 400);
    return json({ data, total: count, page, perPage });
  },

  "/admin-api/leads/get": async (req, _body) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Lead not found" }, 404);
    const { data: notes } = await supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });
    return json({ lead: data, notes: notes || [] });
  },

  "/admin-api/leads/update": async (_req, body) => {
    const { id, ...updates } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase
      .from("leads")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return json({ error: error.message }, 400);
    await logActivity("update", "lead", `Updated lead ${id}`);
    return json({ lead: data });
  },

  "/admin-api/leads/notes/add": async (_req, body) => {
    const { lead_id, note, author } = body;
    if (!lead_id || !note) return json({ error: "Missing fields" }, 400);
    const { data, error } = await supabase
      .from("lead_notes")
      .insert({ lead_id, note, author: author || "Admin" })
      .select()
      .maybeSingle();
    if (error) return json({ error: error.message }, 400);
    await logActivity("update", "lead_note", `Added note to lead ${lead_id}`);
    return json({ note: data });
  },

  "/admin-api/leads/export": async (req, _body) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "";
    let query = supabase.from("leads").select("*").eq("is_archived", false).order("created_at", { ascending: false });
    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return json({ error: error.message }, 400);
    const headers = ["id", "created_at", "lead_type", "name", "phone", "whatsapp", "email", "district_village", "enquiry_type", "product_name", "partner_name", "category_name", "tractor_hp", "message", "status", "priority", "source_page", "language"];
    const rows = (data || []).map((r: any) => headers.map(h => {
      const val = r[h];
      if (val === null || val === undefined) return "";
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    return new Response(csv, {
      status: 200,
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=leads.csv" },
    });
  },

  "/admin-api/leads/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    await logActivity("delete", "lead", `Deleted lead ${id}`);
    return json({ success: true });
  },

  "/admin-api/applications": async (req, _body) => {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const jobId = url.searchParams.get("job_id") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("per_page") || "20");
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("job_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    if (status && status !== "all") query = query.eq("status", status);
    if (jobId) query = query.eq("job_id", jobId);
    query = query.range(offset, offset + perPage - 1);

    const { data, count, error } = await query;
    if (error) return json({ error: error.message }, 400);
    return json({ data, total: count, page, perPage });
  },

  "/admin-api/applications/get": async (req, _body) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase.from("job_applications").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Application not found" }, 404);
    return json({ application: data });
  },

  // The applications bucket is private. Mint a short-lived signed URL so an
  // authenticated admin can download a resume without it being world-readable.
  "/admin-api/applications/resume": async (req, _body) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);

    const { data: app, error: appError } = await supabase
      .from("job_applications")
      .select("resume_url")
      .eq("id", id)
      .maybeSingle();
    if (appError) return json({ error: appError.message }, 400);
    if (!app?.resume_url) return json({ error: "No resume on file" }, 404);

    // Rows written before the bucket was made private stored a full public
    // URL; newer rows store the object path. Normalise to a path.
    let objectPath = app.resume_url as string;
    if (objectPath.startsWith("http")) {
      const marker = "/applications/";
      const idx = objectPath.indexOf(marker);
      if (idx === -1) return json({ error: "Unrecognised resume location" }, 400);
      objectPath = objectPath.slice(idx + marker.length);
    }

    const { data, error } = await supabase.storage
      .from("applications")
      .createSignedUrl(objectPath, RESUME_URL_TTL_SECONDS);
    if (error) return json({ error: error.message }, 400);
    return json({ url: data.signedUrl, expires_in: RESUME_URL_TTL_SECONDS });
  },

  "/admin-api/applications/update": async (_req, body) => {
    const { id, ...updates } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase
      .from("job_applications")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return json({ error: error.message }, 400);
    await logActivity("update", "application", `Updated application ${id}`);
    return json({ application: data });
  },

  "/admin-api/applications/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    await logActivity("delete", "application", `Deleted application ${id}`);
    return json({ success: true });
  },

  "/admin-api/products": async (req, _body) => {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("per_page") || "50");
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("products")
      .select("*, category:categories(name, slug), partner:partners(name, slug)", { count: "exact" })
      .order("display_order", { ascending: true });

    if (search) query = query.or(`name.ilike.%${search}%,positioning.ilike.%${search}%`);
    query = query.range(offset, offset + perPage - 1);

    const { data, count, error } = await query;
    if (error) return json({ error: error.message }, 400);
    return json({ data, total: count, page, perPage });
  },

  "/admin-api/products/get": async (req, _body) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(id, name, slug), partner:partners(id, name, slug)")
      .eq("id", id)
      .maybeSingle();
    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Product not found" }, 404);
    return json({ product: data });
  },

  "/admin-api/products/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase
        .from("products")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      await logActivity("update", "product", `Updated product ${id}`);
      return json({ product: data });
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({ ...fields })
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      await logActivity("create", "product", `Created product ${data?.id}`);
      return json({ product: data });
    }
  },

  "/admin-api/products/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    await logActivity("delete", "product", `Deleted product ${id}`);
    return json({ success: true });
  },

  "/admin-api/categories": async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) return json({ error: error.message }, 400);
    return json({ data });
  },

  "/admin-api/categories/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase
        .from("categories")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ category: data });
    } else {
      const { data, error } = await supabase.from("categories").insert(fields).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ category: data });
    }
  },

  "/admin-api/categories/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ success: true });
  },

  "/admin-api/partners": async () => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) return json({ error: error.message }, 400);
    return json({ data });
  },

  "/admin-api/partners/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase
        .from("partners")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ partner: data });
    } else {
      const { data, error } = await supabase.from("partners").insert(fields).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ partner: data });
    }
  },

  "/admin-api/partners/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ success: true });
  },

  "/admin-api/services": async () => {
    const { data, error } = await supabase.from("services").select("*").order("display_order", { ascending: true });
    if (error) return json({ error: error.message }, 400);
    return json({ data });
  },

  "/admin-api/services/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase.from("services").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ service: data });
    } else {
      const { data, error } = await supabase.from("services").insert(fields).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ service: data });
    }
  },

  "/admin-api/services/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ success: true });
  },

  "/admin-api/resources": async () => {
    const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 400);
    return json({ data });
  },

  "/admin-api/resources/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase.from("resources").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ resource: data });
    } else {
      const { data, error } = await supabase.from("resources").insert(fields).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ resource: data });
    }
  },

  "/admin-api/resources/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ success: true });
  },

  "/admin-api/faqs": async () => {
    const { data, error } = await supabase.from("faqs").select("*").order("display_order", { ascending: true });
    if (error) return json({ error: error.message }, 400);
    return json({ data });
  },

  "/admin-api/faqs/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase.from("faqs").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ faq: data });
    } else {
      const { data, error } = await supabase.from("faqs").insert(fields).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ faq: data });
    }
  },

  "/admin-api/faqs/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ success: true });
  },

  "/admin-api/jobs": async (req, _body) => {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("per_page") || "50");
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) query = query.or(`title.ilike.%${search}%,department.ilike.%${search}%`);
    if (status && status !== "all") query = query.eq("status", status);
    query = query.range(offset, offset + perPage - 1);

    const { data, count, error } = await query;
    if (error) return json({ error: error.message }, 400);
    return json({ data, total: count, page, perPage });
  },

  "/admin-api/jobs/get": async (req, _body) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Job not found" }, 404);
    const { data: apps } = await supabase
      .from("job_applications")
      .select("id, full_name, email, phone, status, created_at")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    return json({ job: data, applications: apps || [] });
  },

  "/admin-api/jobs/save": async (_req, body) => {
    const { id, ...fields } = body;
    const updates: any = { ...fields };
    if (updates.status === "published" && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }
    if (id) {
      const { data, error } = await supabase
        .from("jobs")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      await logActivity("update", "job", `Updated job ${id}`);
      return json({ job: data });
    } else {
      const { data, error } = await supabase.from("jobs").insert(updates).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      await logActivity("create", "job", `Created job ${data?.id}`);
      return json({ job: data });
    }
  },

  "/admin-api/jobs/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    await logActivity("delete", "job", `Deleted job ${id}`);
    return json({ success: true });
  },

  "/admin-api/settings": async () => {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error) return json({ error: error.message }, 400);
    const settings: Record<string, string> = {};
    (data || []).forEach((s: any) => { settings[s.key] = s.value; });
    return json({ settings });
  },

  "/admin-api/settings/save": async (_req, body) => {
    const { settings } = body;
    if (!settings || typeof settings !== "object") return json({ error: "Missing settings" }, 400);
    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from("site_settings")
        .upsert({ key, value: String(value), updated_at: new Date().toISOString() });
    }
    await logActivity("update", "settings", "Updated site settings");
    return json({ success: true });
  },
};

// Routes that don't require authentication
const publicRoutes = new Set(['/admin-api/login']);

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await ctx.params;
    // Keep the original route-map keys so the handler bodies stay untouched.
    const path = '/admin-api/' + (segments || []).join('/');
    const handler = routes[path];
    if (!handler) return json({ error: 'Not found' }, 404);

    let body: any = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      if ((req.headers.get('content-type') || '').includes('application/json')) {
        try { body = await req.json(); } catch { body = {}; }
      }
    }

    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const authed = publicRoutes.has(path) || (await validateSession(token));
    if (!authed) return json({ error: 'Unauthorized' }, 401);

    return await handler(req as unknown as Request, body, authed);
  } catch (err: any) {
    return json({ error: err?.message || 'Internal server error' }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
