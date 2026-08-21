import { type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServiceClient, siteOrigin } from '@/lib/server/supabase-admin';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateResetToken,
  sha256,
} from '@/lib/server/passwords';
import { validateImage } from '@/lib/server/image-upload';
import { notifyApplication, resolveRecoveryEmail } from '@/lib/server/careers-notify';
import { sendMail, passwordResetEmail, configuredTransport } from '@/lib/server/mailer';
import { slugify } from '@/lib/utils';

/**
 * Admin API — ported from the Supabase Edge Function (Deno) to a Next route
 * handler. The route map below carries the original CMS endpoints plus the
 * recruitment endpoints (job categories, locations, employment types,
 * applications, password management).
 *
 * The service-role key is read from a server-only env var and never reaches
 * the browser, which is the main reason this moved in-process.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lets the handler bodies below keep using a bare `supabase.` reference while
// the client itself is built lazily and shared with the public apply route.
const supabase = new Proxy({} as SupabaseClient, {
  get: (_t, prop) => (getServiceClient() as any)[prop],
});

// Bootstrap password. Used only until the administrator sets one from the
// portal, after which the scrypt hash in admin_credentials takes over. There
// is no fallback if both are absent — login fails closed rather than
// accepting a password baked into source control.
const adminPassword = () => process.env.ADMIN_PASSWORD || '';
const SESSION_TTL_HOURS = 12;
const RESUME_URL_TTL_SECONDS = 300;
const RESET_TOKEN_TTL_MINUTES = 30;

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

/**
 * Fails closed on every path, including its own errors.
 *
 * If this throws instead of returning false, the outer handler turns it into a
 * 500 — which tells an unauthenticated caller that something server-side went
 * wrong, and previously leaked the reason. An unverifiable session is simply
 * not a valid session.
 */
async function validateSession(token: string): Promise<boolean> {
  if (!token) return false;
  try {
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
  } catch {
    return false;
  }
}

async function destroySession(token: string): Promise<void> {
  if (!token) return;
  await supabase.from("admin_sessions").delete().eq("token", token);
}

/** Invalidates every session — used after a password change or reset. */
async function destroyAllSessions(exceptToken?: string): Promise<void> {
  let query = supabase.from("admin_sessions").delete();
  query = exceptToken ? query.neq("token", exceptToken) : query.neq("token", "");
  await query;
}

// ---------------------------------------------------------------------------
// Admin credentials
//
// admin_credentials holds at most one row. While it is empty the ADMIN_PASSWORD
// env var is authoritative and the first successful login migrates it into a
// scrypt hash, so the plaintext stops being the thing that grants access as
// soon as the portal is used once. From then on the env var is ignored.
// ---------------------------------------------------------------------------

interface StoredCredential {
  password_hash: string;
  must_change_password: boolean;
}

async function getStoredCredential(): Promise<StoredCredential | null> {
  const { data, error } = await supabase
    .from("admin_credentials")
    .select("password_hash, must_change_password")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return data as StoredCredential;
}

async function writeCredential(password: string, mustChange: boolean): Promise<void> {
  const password_hash = await hashPassword(password);
  const { error } = await supabase.from("admin_credentials").upsert({
    id: 1,
    password_hash,
    must_change_password: mustChange,
    password_changed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Could not save the new password: ${error.message}`);
}

interface PasswordCheck {
  valid: boolean;
  mustChange: boolean;
  /** True when the env bootstrap was used and has now been migrated to a hash. */
  migrated: boolean;
}

async function checkAdminPassword(password: string): Promise<PasswordCheck> {
  const stored = await getStoredCredential();

  if (stored) {
    const valid = await verifyPassword(password, stored.password_hash);
    return { valid, mustChange: valid && stored.must_change_password, migrated: false };
  }

  // No hash on file yet — fall back to the bootstrap env var.
  const bootstrap = adminPassword();
  if (!bootstrap) return { valid: false, mustChange: false, migrated: false };
  if (!timingSafeEqual(password, bootstrap)) return { valid: false, mustChange: false, migrated: false };

  // Migrate immediately so the plaintext env var stops being the credential.
  // A failure here must not block a valid login, so it is swallowed.
  let migrated = false;
  try {
    await writeCredential(password, false);
    migrated = true;
  } catch {
    migrated = false;
  }
  return { valid: true, mustChange: false, migrated };
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

/**
 * Preflight for anything that needs the database.
 *
 * Without this, a missing environment variable surfaced as a generic 500 from
 * the outer catch — technically safe, but it told the person actually setting
 * the site up nothing at all. Now the variable is named outside production,
 * where the reader is the developer at a terminal, and the production response
 * stays generic with the detail going to the server log instead.
 */
function adminConfigError(): string | null {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length === 0) return null;

  console.error(
    `[admin-api] Admin portal is not configured. Missing: ${missing.join(", ")}. ` +
      `Add ${missing.length === 1 ? "it" : "them"} to .env.local (local) or the host's ` +
      `environment variables (production), then restart / redeploy.`
  );

  if (process.env.NODE_ENV === "production") {
    return "The admin portal is not fully configured on this deployment. Please contact your developer.";
  }
  return (
    `Admin portal not configured: ${missing.join(", ")} ` +
    `${missing.length === 1 ? "is" : "are"} missing. Add ${missing.length === 1 ? "it" : "them"} ` +
    `to .env.local and restart the dev server.`
  );
}

/** Same counter, parameterised — used by the password-reset endpoints. */
async function checkGenericRateLimit(
  action: string,
  key: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("admin_activity")
      .select("id", { count: "exact", head: true })
      .eq("action", action)
      .eq("entity_type", key)
      .gte("created_at", windowStart);
    const attempts = count || 0;
    return { allowed: attempts < maxAttempts, remaining: Math.max(0, maxAttempts - attempts) };
  } catch {
    // Failing to read the limiter must not lock a legitimate admin out.
    return { allowed: true, remaining: maxAttempts };
  }
}

// ---------------------------------------------------------------------------
// Recruitment helpers
// ---------------------------------------------------------------------------

/**
 * Turns a Postgres/PostgREST error into something an administrator can act on.
 *
 * Raw messages name columns, constraints and sometimes the schema — that is
 * internal structure, and "duplicate key value violates unique constraint
 * job_categories_name_key" tells a non-technical admin nothing useful anyway.
 * The original is logged for whoever maintains the site.
 */
function friendlyDbError(error: { message?: string; code?: string } | null | undefined): string {
  const message = String(error?.message || '');
  console.error('[admin-api:db]', error?.code || '', message);

  if (/duplicate key|already exists|unique constraint/i.test(message)) {
    return 'That name is already in use. Please choose a different one.';
  }
  if (/violates foreign key/i.test(message)) {
    return 'That item is still linked to other records and cannot be changed yet.';
  }
  if (/violates not-null/i.test(message)) {
    return 'A required field is missing. Please fill in every field marked with *.';
  }
  if (/violates check constraint/i.test(message)) {
    return 'One of the values entered is not allowed. Please review the form and try again.';
  }
  if (/invalid input syntax/i.test(message)) {
    return 'One of the values entered is not in the expected format. Please review the form.';
  }
  if (/could not find the .* column|schema cache/i.test(message)) {
    return 'The database is missing a required column. The recruitment migration may not have been run yet.';
  }
  if (/permission denied|row-level security/i.test(message)) {
    return 'The server is not permitted to make that change. Please contact your developer.';
  }
  return 'Could not save that change. Please try again.';
}

function emptyToNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Makes a user-typed search term safe to interpolate into a PostgREST `.or()`
 * expression.
 *
 * PostgREST parameterises values against SQL injection, but `.or()` takes a
 * *filter grammar* string: an unescaped comma or parenthesis inside the term
 * ends the current condition and starts another one, so `a,status.eq.published`
 * typed into a search box would rewrite the query. Strip the delimiters and
 * cap the length — a 10,000-character search term is not a search.
 */
function escapeFilterValue(value: string): string {
  return String(value)
    .replace(/[,()\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

/**
 * Adds the mapped locations and live application count to each job row.
 *
 * Done in two batched queries rather than per row: the admin jobs list is the
 * page most likely to grow, and N+1 there is how a fast page becomes a slow one.
 */
async function attachJobExtras(rows: any[]): Promise<any[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((row) => row.id);

  const [{ data: mapped }, { data: apps }] = await Promise.all([
    supabase
      .from("job_location_map")
      .select("job_id, job_locations(id, name, slug, active, display_order)")
      .in("job_id", ids),
    supabase.from("job_applications").select("job_id").in("job_id", ids),
  ]);

  const byJob = new Map<string, any[]>();
  (mapped || []).forEach((row: any) => {
    const rel = Array.isArray(row.job_locations) ? row.job_locations[0] : row.job_locations;
    if (!rel) return;
    const list = byJob.get(row.job_id) || [];
    list.push(rel);
    byJob.set(row.job_id, list);
  });

  const appCounts = new Map<string, number>();
  (apps || []).forEach((row: any) => {
    if (row.job_id) appCounts.set(row.job_id, (appCounts.get(row.job_id) || 0) + 1);
  });

  return rows.map((row) => {
    const locations = (byJob.get(row.id) || []).sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    return {
      ...row,
      locations,
      location_ids: locations.map((l: any) => l.id),
      application_count: appCounts.get(row.id) || 0,
    };
  });
}

/** Counts jobs grouped by a foreign-key column, for the "in use" badges. */
async function countJobsByColumn(column: string): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const { data } = await supabase.from("jobs").select(column);
  (data || []).forEach((row: any) => {
    const key = row[column];
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

/** Case-insensitive duplicate check on a lookup table's name. */
async function lookupNameTaken(table: string, name: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from(table).select("id").ilike("name", name).limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return Boolean(data && data.length > 0);
}

/**
 * Slug that is unique within a lookup table. Falls back to a numeric suffix,
 * so two categories called "Sales" and "sales" cannot collide on the URL.
 */
async function uniqueLookupSlug(table: string, source: string, excludeId?: string): Promise<string> {
  const base = slugify(String(source || "")) || "item";
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    let query = supabase.from(table).select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Unique job slug. Two vacancies genuinely can share a title — "Salesman"
 * reopened next season — so a collision appends a counter rather than failing.
 */
async function uniqueJobSlug(source: string, excludeId?: string): Promise<string> {
  const base = slugify(String(source || "")) || "position";
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    let query = supabase.from("jobs").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Recomputes the comma-joined `jobs.location` snapshot for one job. */
async function refreshLocationSnapshot(jobId: string): Promise<void> {
  const { data } = await supabase
    .from("job_location_map")
    .select("job_locations(name, display_order)")
    .eq("job_id", jobId);

  const names = (data || [])
    .map((row: any) => {
      const rel = row.job_locations;
      if (!rel) return null;
      return Array.isArray(rel) ? rel[0] : rel;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((rel: any) => rel.name);

  await supabase
    .from("jobs")
    .update({ location: names.length ? names.join(", ") : null })
    .eq("id", jobId);
}

/** After a location is renamed, refresh every job that references it. */
async function refreshLocationSnapshotsFor(locationId: string): Promise<void> {
  const { data } = await supabase.from("job_location_map").select("job_id").eq("location_id", locationId);
  for (const row of data || []) {
    await refreshLocationSnapshot((row as any).job_id);
  }
}

/** The effective careers recipient, shown read-only on the settings screen. */
async function resolveCareersEmailForDisplay(): Promise<string> {
  const { data } = await supabase.from("site_settings").select("key, value").in("key", ["careers_email", "email"]);
  const map = new Map((data || []).map((row: any) => [row.key, row.value]));
  return (map.get("careers_email") || map.get("email") || "info@shyamalikrishna.com").trim();
}

/** Replaces a job's location set, then refreshes the denormalised snapshot. */
async function syncJobLocations(jobId: string, locationIds: unknown): Promise<void> {
  if (!Array.isArray(locationIds)) return;
  const ids = Array.from(new Set(locationIds.map((id) => String(id)).filter(Boolean)));

  await supabase.from("job_location_map").delete().eq("job_id", jobId);
  if (ids.length > 0) {
    await supabase
      .from("job_location_map")
      .insert(ids.map((location_id) => ({ job_id: jobId, location_id })));
  }
  await refreshLocationSnapshot(jobId);
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
    const stored = await getStoredCredential();
    if (!stored && !adminPassword()) {
      await logActivity("login_attempt", ip, "ADMIN_PASSWORD not configured");
      console.error("[admin-api] No stored password hash and ADMIN_PASSWORD is unset — nobody can sign in.");
      return json(
        {
          error:
            process.env.NODE_ENV === "production"
              ? "Admin login is not configured on this deployment. Please contact your developer."
              : "Admin login is not configured: ADMIN_PASSWORD is missing. Add it to .env.local and restart the dev server.",
        },
        503
      );
    }

    const check = await checkAdminPassword(password);
    if (check.valid) {
      const token = await createSession(ip, req.headers.get("user-agent") || "");
      await supabase
        .from("admin_credentials")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", 1);
      await logActivity("login", "auth", check.migrated ? "Admin logged in (password migrated to hash)" : "Admin logged in");
      return json({
        token,
        expires_in: SESSION_TTL_HOURS * 3600,
        must_change_password: check.mustChange,
      });
    }

    await logActivity("login_attempt", ip, "Failed login attempt");
    return json({ error: "Invalid password." }, 401);
  },

  // -------------------------------------------------------------------------
  // Password management
  // -------------------------------------------------------------------------

  "/admin-api/password/change": async (req, body) => {
    const current = String(body?.current_password || "");
    const next = String(body?.new_password || "");
    const confirm = String(body?.confirm_password || "");

    if (!current || !next) return json({ error: "Current and new password are required." }, 400);
    if (next !== confirm) return json({ error: "The new passwords do not match." }, 400);
    if (next === current) return json({ error: "The new password must be different from the current one." }, 400);

    const weak = validatePasswordStrength(next);
    if (weak) return json({ error: weak }, 400);

    const check = await checkAdminPassword(current);
    if (!check.valid) {
      await logActivity("password_change_failed", getClientIp(req), "Incorrect current password");
      return json({ error: "The current password is incorrect." }, 401);
    }

    await writeCredential(next, false);

    // Every other browser holding a session was authenticated with the old
    // password; a password change should evict them.
    const activeToken = (req.headers.get("authorization") || "").replace("Bearer ", "");
    await destroyAllSessions(activeToken);
    await logActivity("password_change", "auth", "Administrator password changed");
    return json({ success: true });
  },

  /**
   * Starts recovery. The link is only ever mailed to the address already on
   * file — never to an address supplied in the request — so this endpoint
   * cannot be used to redirect a reset to an attacker's mailbox. It also
   * always answers 200, so it cannot be used to probe anything either.
   */
  "/admin-api/password/reset-request": async (req) => {
    const ip = getClientIp(req);
    const { allowed } = await checkGenericRateLimit("password_reset_request", ip, 3, 30);
    if (!allowed) {
      return json({ error: "Too many reset requests. Please try again in half an hour." }, 429);
    }
    await logActivity("password_reset_request", ip, "Password reset requested");

    if (configuredTransport() === "none") {
      return json(
        { error: "Email is not configured on this site, so a reset link cannot be sent. Ask your developer to set SMTP_HOST, SMTP_USER and SMTP_PASSWORD." },
        503
      );
    }

    const recipient = await resolveRecoveryEmail();
    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("admin_password_resets")
      .insert({ token_hash: tokenHash, expires_at: expiresAt, ip_address: ip });
    if (error) return json({ error: "Could not start the reset. Please try again." }, 500);

    const resetUrl = `${siteOrigin(req)}/admin/reset-password?token=${encodeURIComponent(token)}`;
    const template = passwordResetEmail(resetUrl, RESET_TOKEN_TTL_MINUTES, ip);
    const sent = await sendMail({
      to: recipient,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!sent.ok) {
      // The token is useless without the email, so retract it.
      await supabase.from("admin_password_resets").delete().eq("token_hash", tokenHash);
      return json({ error: "Could not send the reset email. Please check the mail settings and try again." }, 502);
    }

    // Show the masked recipient so the admin knows which inbox to open,
    // without printing a full address on a public page.
    const [localPart, domain] = recipient.split("@");
    const masked = `${localPart.slice(0, 2)}${"*".repeat(Math.max(1, localPart.length - 2))}@${domain || ""}`;
    return json({ success: true, sent_to: masked, expires_in_minutes: RESET_TOKEN_TTL_MINUTES });
  },

  "/admin-api/password/reset-confirm": async (req, body) => {
    const token = String(body?.token || "");
    const next = String(body?.new_password || "");
    const confirm = String(body?.confirm_password || "");

    if (!token) return json({ error: "This reset link is invalid." }, 400);
    if (next !== confirm) return json({ error: "The new passwords do not match." }, 400);
    const weak = validatePasswordStrength(next);
    if (weak) return json({ error: weak }, 400);

    const { data: record } = await supabase
      .from("admin_password_resets")
      .select("id, expires_at, used_at")
      .eq("token_hash", sha256(token))
      .maybeSingle();

    // One answer for missing, already-used and expired — a reset link that
    // has been consumed should look exactly like one that never existed.
    if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
      await logActivity("password_reset_failed", getClientIp(req), "Invalid or expired reset token");
      return json({ error: "This reset link has expired or has already been used. Please request a new one." }, 400);
    }

    await writeCredential(next, false);
    await supabase
      .from("admin_password_resets")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id);

    // Anyone already signed in was authenticated with the old password.
    await destroyAllSessions();
    await logActivity("password_reset", "auth", "Administrator password reset via email link");
    return json({ success: true });
  },

  /** Whether recovery is even possible, so the login screen can say so. */
  "/admin-api/password/recovery-status": async () => {
    return json({ email_configured: configuredTransport() !== "none" });
  },

  /**
   * Server-side logout. The previous version only answered 200 and left the
   * row in admin_sessions, so a token copied out of localStorage stayed valid
   * for the rest of its 12 hours after the admin had "signed out".
   */
  "/admin-api/logout": async (req, _body) => {
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    await destroySession(token);
    await logActivity("logout", "auth", "Admin logged out");
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
      recentJobs,
      categoriesResult,
      locationsResult,
    ] = await Promise.all([
      supabase.from("leads").select("lead_type, status, created_at").eq("is_archived", false),
      supabase.from("jobs").select("status"),
      supabase.from("job_applications").select("status, notification_status, created_at"),
      supabase.from("admin_activity").select("action, entity_type, description, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("leads").select("id, name, lead_type, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase
        .from("job_applications")
        .select("id, full_name, job_title_snapshot, job_slug, preferred_location, status, notification_status, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("jobs").select("id, title, slug, status, vacancies, published_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("job_categories").select("active"),
      supabase.from("job_locations").select("active"),
    ]);

    const leads = leadsResult.data || [];
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === "new").length;
    const leadTypeCounts: Record<string, number> = {};
    leads.forEach(l => { leadTypeCounts[l.lead_type] = (leadTypeCounts[l.lead_type] || 0) + 1; });

    const jobs = jobsResult.data || [];
    const publishedJobs = jobs.filter(j => j.status === "published").length;
    const draftJobs = jobs.filter(j => j.status === "draft").length;
    const closedJobs = jobs.filter(j => j.status === "closed" || j.status === "archived").length;

    const applications = applicationsResult.data || [];
    const totalApplications = applications.length;
    const newApplications = applications.filter(a => a.status === "new").length;
    // Surfaced on the dashboard because a failed alert is invisible otherwise —
    // the application is safe in the database but nobody has been told about it.
    const failedNotifications = applications.filter(
      a => a.notification_status === "failed" || a.notification_status === "skipped"
    ).length;

    const activeCategories = (categoriesResult.data || []).filter((c: any) => c.active).length;
    const activeLocations = (locationsResult.data || []).filter((l: any) => l.active).length;

    return json({
      stats: {
        totalLeads,
        newLeads,
        // Kept under the old name so nothing that already reads it breaks.
        openJobs: publishedJobs,
        publishedJobs,
        draftJobs,
        closedJobs,
        totalApplications,
        newApplications,
        failedNotifications,
        activeCategories,
        activeLocations,
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

    if (search) {
      const term = escapeFilterValue(search);
      query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,product_name.ilike.%${term}%`);
    }
    if (status && status !== "all") query = query.eq("status", status);
    if (leadType && leadType !== "all") query = query.eq("lead_type", leadType);

    query = query.range(offset, offset + perPage - 1);
    const { data, count, error } = await query;
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ data, total: count, page, perPage });
  },

  "/admin-api/leads/get": async (req, _body) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);
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
    if (error) return json({ error: friendlyDbError(error) }, 400);
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
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("update", "lead_note", `Added note to lead ${lead_id}`);
    return json({ note: data });
  },

  "/admin-api/leads/export": async (req, _body) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "";
    let query = supabase.from("leads").select("*").eq("is_archived", false).order("created_at", { ascending: false });
    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return json({ error: friendlyDbError(error) }, 400);
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
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("delete", "lead", `Deleted lead ${id}`);
    return json({ success: true });
  },

  "/admin-api/applications": async (req, _body) => {
    const url = new URL(req.url);
    const search = escapeFilterValue(url.searchParams.get("search") || "");
    const status = url.searchParams.get("status") || "";
    const jobId = url.searchParams.get("job_id") || "";
    const category = url.searchParams.get("category") || "";
    const location = url.searchParams.get("location") || "";
    const dateFrom = url.searchParams.get("date_from") || "";
    const dateTo = url.searchParams.get("date_to") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") || "20") || 20));
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("job_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,job_title_snapshot.ilike.%${search}%`
      );
    }
    if (status && status !== "all") query = query.eq("status", status);
    if (jobId && jobId !== "all") query = query.eq("job_id", jobId);
    if (category && category !== "all") query = query.eq("category_snapshot", category);
    if (location && location !== "all") query = query.eq("preferred_location", location);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
    // `to` is inclusive of the whole day.
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

    query = query.range(offset, offset + perPage - 1);

    const { data, count, error } = await query;
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ data, total: count, page, perPage });
  },

  /** Filter option lists for the applications screen. */
  "/admin-api/applications/filters": async () => {
    const [{ data: jobs }, { data: categories }, { data: locations }] = await Promise.all([
      supabase.from("jobs").select("id, title, status").order("created_at", { ascending: false }),
      supabase.from("job_categories").select("name").order("display_order", { ascending: true }),
      supabase.from("job_locations").select("name").order("display_order", { ascending: true }),
    ]);
    return json({
      jobs: jobs || [],
      categories: (categories || []).map((c: any) => c.name),
      locations: (locations || []).map((l: any) => l.name),
    });
  },

  /**
   * Re-sends the notification for an application that failed (or was submitted
   * while email was unconfigured). Touches only the notification columns, so
   * it can never produce a second application record.
   */
  "/admin-api/applications/resend": async (req, body) => {
    const { id } = body || {};
    if (!id) return json({ error: "Missing id" }, 400);

    const result = await notifyApplication(String(id), req);
    await logActivity("notify", "application", `Resent notification for ${id}: ${result.status}`);

    if (result.status === "sent") return json({ success: true, notification_status: "sent" });
    return json(
      {
        error:
          result.status === "skipped"
            ? "Email is not configured on this site. Ask your developer to set SMTP_HOST, SMTP_USER and SMTP_PASSWORD."
            : result.error || "Could not send the notification.",
        notification_status: result.status,
      },
      502
    );
  },

  "/admin-api/applications/get": async (req, _body) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase.from("job_applications").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);
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
    if (appError) return json({ error: friendlyDbError(appError) }, 400);
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
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ url: data.signedUrl, expires_in: RESUME_URL_TTL_SECONDS });
  },

  /**
   * Only status and internal notes are writable.
   *
   * The previous version spread the whole body into the UPDATE, which meant an
   * authenticated request could rewrite an applicant's name, email, or the
   * resume_url pointing into private storage. An application is a record of
   * what someone submitted; the office's opinion of it is the only mutable part.
   */
  "/admin-api/applications/update": async (_req, body) => {
    const { id, status, internal_notes } = body || {};
    if (!id) return json({ error: "Missing id" }, 400);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status !== undefined) {
      const allowed = ["new", "under_review", "shortlisted", "interview", "selected", "rejected", "withdrawn"];
      if (!allowed.includes(String(status))) return json({ error: "Unknown application status." }, 400);
      updates.status = status;
    }
    if (internal_notes !== undefined) {
      updates.internal_notes = String(internal_notes).slice(0, 5000) || null;
    }

    const { data, error } = await supabase
      .from("job_applications")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);
    if (!data) return json({ error: "Application not found" }, 404);
    await logActivity("update", "application", `Updated application ${id}`);
    return json({ application: data });
  },

  "/admin-api/applications/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);

    // Take the CV out of storage too, otherwise deleting the record leaves the
    // candidate's document sitting in the bucket with nothing referencing it.
    const { data: app } = await supabase
      .from("job_applications")
      .select("resume_url, full_name")
      .eq("id", id)
      .maybeSingle();

    if (app?.resume_url && !String(app.resume_url).startsWith("http")) {
      try {
        await supabase.storage.from("applications").remove([app.resume_url]);
      } catch {
        // The row still goes; an orphaned object is the lesser problem.
      }
    }

    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("delete", "application", `Deleted application from ${app?.full_name || id}`);
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

    if (search) {
      const term = escapeFilterValue(search);
      query = query.or(`name.ilike.%${term}%,positioning.ilike.%${term}%`);
    }
    query = query.range(offset, offset + perPage - 1);

    const { data, count, error } = await query;
    if (error) return json({ error: friendlyDbError(error) }, 400);
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
    if (error) return json({ error: friendlyDbError(error) }, 400);
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
      if (error) return json({ error: friendlyDbError(error) }, 400);
      await logActivity("update", "product", `Updated product ${id}`);
      return json({ product: data });
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({ ...fields })
        .select()
        .maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      await logActivity("create", "product", `Created product ${data?.id}`);
      return json({ product: data });
    }
  },

  "/admin-api/products/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("delete", "product", `Deleted product ${id}`);
    return json({ success: true });
  },

  "/admin-api/categories": async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) return json({ error: friendlyDbError(error) }, 400);
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
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ category: data });
    } else {
      const { data, error } = await supabase.from("categories").insert(fields).select().maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ category: data });
    }
  },

  "/admin-api/categories/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ success: true });
  },

  "/admin-api/partners": async () => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) return json({ error: friendlyDbError(error) }, 400);
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
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ partner: data });
    } else {
      const { data, error } = await supabase.from("partners").insert(fields).select().maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ partner: data });
    }
  },

  "/admin-api/partners/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ success: true });
  },

  "/admin-api/services": async () => {
    const { data, error } = await supabase.from("services").select("*").order("display_order", { ascending: true });
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ data });
  },

  "/admin-api/services/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase.from("services").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ service: data });
    } else {
      const { data, error } = await supabase.from("services").insert(fields).select().maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ service: data });
    }
  },

  "/admin-api/services/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ success: true });
  },

  "/admin-api/resources": async () => {
    const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ data });
  },

  "/admin-api/resources/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase.from("resources").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ resource: data });
    } else {
      const { data, error } = await supabase.from("resources").insert(fields).select().maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ resource: data });
    }
  },

  "/admin-api/resources/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ success: true });
  },

  "/admin-api/faqs": async () => {
    const { data, error } = await supabase.from("faqs").select("*").order("display_order", { ascending: true });
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ data });
  },

  "/admin-api/faqs/save": async (_req, body) => {
    const { id, ...fields } = body;
    if (id) {
      const { data, error } = await supabase.from("faqs").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ faq: data });
    } else {
      const { data, error } = await supabase.from("faqs").insert(fields).select().maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      return json({ faq: data });
    }
  },

  "/admin-api/faqs/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    return json({ success: true });
  },

  /**
   * Banner upload for the job editor.
   *
   * Multipart rather than JSON, so `handle` leaves the body unread and the
   * stream is still here to consume. Returns the public URL, which the editor
   * puts in the draft and saves with the rest of the job — an upload on its
   * own changes nothing until the job is saved.
   */
  "/admin-api/jobs/image": async (req) => {
    let file: File | null = null;
    try {
      const form = await req.formData();
      const entry = form.get("file");
      file = entry instanceof File ? entry : null;
    } catch {
      return json({ error: "Could not read the uploaded file." }, 400);
    }

    if (!file) return json({ error: "Choose an image to upload." }, 400);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateImage(file, bytes);
    if (!check.ok) return json({ error: check.error }, 400);

    const { error } = await supabase.storage
      .from("job-images")
      .upload(check.objectPath, check.bytes, {
        contentType: check.contentType,
        // Paths carry a UUID, so a collision means something is badly wrong
        // and overwriting would hide it.
        upsert: false,
      });

    if (error) {
      console.error("[admin-api] banner upload failed:", error.message);
      return json(
        {
          error: /bucket/i.test(error.message)
            ? "Image storage is not set up yet. Run supabase/migrations/0003_job_banner_image.sql."
            : "Could not upload that image. Please try again.",
        },
        400
      );
    }

    const { data } = supabase.storage.from("job-images").getPublicUrl(check.objectPath);
    await logActivity("upload", "job", `Uploaded a job banner image`);
    return json({ url: data.publicUrl });
  },

  "/admin-api/jobs": async (req, _body) => {
    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();
    const status = url.searchParams.get("status") || "";
    const categoryId = url.searchParams.get("category_id") || "";
    const locationId = url.searchParams.get("location_id") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
    const perPage = Math.min(200, Math.max(1, parseInt(url.searchParams.get("per_page") || "50") || 50));
    const offset = (page - 1) * perPage;

    let query = supabase
      .from("jobs")
      .select("*, category:job_categories(id, name, slug, active)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) query = query.or(`title.ilike.%${escapeFilterValue(search)}%,department.ilike.%${escapeFilterValue(search)}%`);
    if (status && status !== "all") query = query.eq("status", status);
    if (categoryId && categoryId !== "all") query = query.eq("category_id", categoryId);

    // Location lives in a join table, so narrow by job id first.
    if (locationId && locationId !== "all") {
      const { data: mapped } = await supabase.from("job_location_map").select("job_id").eq("location_id", locationId);
      const ids = (mapped || []).map((row: any) => row.job_id);
      if (ids.length === 0) return json({ data: [], total: 0, page, perPage });
      query = query.in("id", ids);
    }

    query = query.range(offset, offset + perPage - 1);
    const { data, count, error } = await query;
    if (error) return json({ error: friendlyDbError(error) }, 400);

    const withExtras = await attachJobExtras(data || []);
    return json({ data: withExtras, total: count, page, perPage });
  },

  "/admin-api/jobs/get": async (req, _body) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const { data, error } = await supabase
      .from("jobs")
      .select("*, category:job_categories(id, name, slug, active)")
      .eq("id", id)
      .maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);
    if (!data) return json({ error: "Job not found" }, 404);

    const { data: mapped } = await supabase
      .from("job_location_map")
      .select("location_id, job_locations(id, name, slug, active, display_order)")
      .eq("job_id", id);

    const locations = (mapped || [])
      .map((row: any) => (Array.isArray(row.job_locations) ? row.job_locations[0] : row.job_locations))
      .filter(Boolean)
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));

    const { data: apps } = await supabase
      .from("job_applications")
      .select("id, full_name, email, phone, status, created_at")
      .eq("job_id", id)
      .order("created_at", { ascending: false });

    return json({
      job: { ...data, locations, location_ids: locations.map((l: any) => l.id) },
      applications: apps || [],
    });
  },

  "/admin-api/jobs/save": async (_req, body) => {
    const { id, location_ids, ...raw } = body || {};

    const title = String(raw?.title || "").trim();
    if (!title) return json({ error: "Job title is required." }, 400);
    if (title.length > 160) return json({ error: "Job title must be 160 characters or fewer." }, 400);

    const status = ["draft", "published", "closed"].includes(String(raw?.status))
      ? String(raw.status)
      : "draft";

    const vacancies = Number(raw?.vacancies);
    if (!Number.isInteger(vacancies) || vacancies < 1 || vacancies > 9999) {
      return json({ error: "Number of vacancies must be a whole number of at least 1." }, 400);
    }

    // A published job needs enough on it to be worth a candidate's time; a
    // draft is allowed to be half-finished, which is the entire point of one.
    if (status === "published") {
      if (!raw?.category_id) return json({ error: "A published job needs a category." }, 400);
      if (!Array.isArray(location_ids) || location_ids.length === 0) {
        return json({ error: "A published job needs at least one location." }, 400);
      }
      if (!String(raw?.employment_type || "").trim()) {
        return json({ error: "A published job needs an employment type." }, 400);
      }
    }

    if (raw?.category_id) {
      const { data: category } = await supabase
        .from("job_categories")
        .select("id, name, active")
        .eq("id", raw.category_id)
        .maybeSingle();
      if (!category) return json({ error: "The selected category no longer exists." }, 400);
      // Snapshot the name so the job still reads correctly if the category goes.
      raw.department = category.name;
    }

    const deadline = emptyToNull(raw?.application_deadline);
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return json({ error: "Application deadline must be a valid date." }, 400);
    }

    const salaryMin = raw?.salary_min === "" || raw?.salary_min === null || raw?.salary_min === undefined ? null : Number(raw.salary_min);
    const salaryMax = raw?.salary_max === "" || raw?.salary_max === null || raw?.salary_max === undefined ? null : Number(raw.salary_max);
    if (salaryMin !== null && (!Number.isFinite(salaryMin) || salaryMin < 0)) {
      return json({ error: "Minimum salary must be a positive number." }, 400);
    }
    if (salaryMax !== null && (!Number.isFinite(salaryMax) || salaryMax < 0)) {
      return json({ error: "Maximum salary must be a positive number." }, 400);
    }
    if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
      return json({ error: "Maximum salary cannot be lower than the minimum." }, 400);
    }

    const updates: Record<string, unknown> = {
      title,
      title_hi: emptyToNull(raw?.title_hi),
      slug: await uniqueJobSlug(raw?.slug || title, id),
      category_id: raw?.category_id || null,
      department: emptyToNull(raw?.department),
      vacancies,
      employment_type: emptyToNull(raw?.employment_type),
      experience: emptyToNull(raw?.experience),
      experience_level: emptyToNull(raw?.experience_level),
      min_experience: emptyToNull(raw?.min_experience),
      max_experience: emptyToNull(raw?.max_experience),
      summary: emptyToNull(raw?.summary),
      summary_hi: emptyToNull(raw?.summary_hi),
      description: emptyToNull(raw?.description),
      description_hi: emptyToNull(raw?.description_hi),
      responsibilities: emptyToNull(raw?.responsibilities),
      requirements: emptyToNull(raw?.requirements),
      skills: emptyToNull(raw?.skills),
      preferred_qualifications: emptyToNull(raw?.preferred_qualifications),
      what_we_offer: emptyToNull(raw?.what_we_offer),
      salary_type: emptyToNull(raw?.salary_type),
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_period: emptyToNull(raw?.salary_period),
      salary_negotiable: Boolean(raw?.salary_negotiable),
      contact_info: emptyToNull(raw?.contact_info),
      additional_notes: emptyToNull(raw?.additional_notes),
      image_url: emptyToNull(raw?.image_url),
      application_deadline: deadline,
      seo_title: emptyToNull(raw?.seo_title),
      seo_description: emptyToNull(raw?.seo_description),
      status,
    };

    if (id) {
      const { data: current } = await supabase.from("jobs").select("published_at").eq("id", id).maybeSingle();
      // First publish stamps the date; re-publishing later keeps the original.
      if (status === "published" && !current?.published_at) {
        updates.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("jobs")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);

      await syncJobLocations(id, location_ids);
      await logActivity("update", "job", `Updated job "${title}" (${status})`);
      return json({ job: data });
    }

    if (status === "published") updates.published_at = new Date().toISOString();

    const { data, error } = await supabase.from("jobs").insert(updates).select().maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);

    if (data?.id) await syncJobLocations(data.id, location_ids);
    await logActivity("create", "job", `Created job "${title}" (${status})`);
    return json({ job: data });
  },

  /** Status-only transition, for the Publish / Unpublish / Close row actions. */
  "/admin-api/jobs/status": async (_req, body) => {
    const { id, status } = body || {};
    if (!id) return json({ error: "Missing id" }, 400);
    if (!["draft", "published", "closed"].includes(String(status))) {
      return json({ error: "Unknown status." }, 400);
    }

    const { data: current } = await supabase
      .from("jobs")
      .select("published_at, title, category_id, employment_type")
      .eq("id", id)
      .maybeSingle();
    if (!current) return json({ error: "Job not found" }, 404);

    if (status === "published") {
      const { count } = await supabase
        .from("job_location_map")
        .select("job_id", { count: "exact", head: true })
        .eq("job_id", id);
      if (!current.category_id || (count || 0) === 0 || !current.employment_type) {
        return json(
          { error: "This job is missing a category, employment type or location. Open it and complete those fields before publishing." },
          400
        );
      }
    }

    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "published" && !current.published_at) updates.published_at = new Date().toISOString();

    const { data, error } = await supabase.from("jobs").update(updates).eq("id", id).select().maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("update", "job", `Set "${current.title}" to ${status}`);
    return json({ job: data });
  },

  /**
   * Deletion is gated on the application count. Applications are the one thing
   * here that cannot be recreated — a candidate's CV and their consent to be
   * considered — so the default answer for a job that has any is "close it".
   * `confirm: true` is the admin explicitly overriding that.
   */
  "/admin-api/jobs/delete": async (_req, body) => {
    const { id, confirm } = body || {};
    if (!id) return json({ error: "Missing id" }, 400);

    const { data: job } = await supabase.from("jobs").select("title").eq("id", id).maybeSingle();
    if (!job) return json({ error: "Job not found" }, 404);

    const { count } = await supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    const applicationCount = count || 0;

    if (applicationCount > 0 && !confirm) {
      return json(
        {
          error: `This job has ${applicationCount} application${applicationCount === 1 ? "" : "s"}. Deleting it may affect historical records. Do you want to close/archive it instead?`,
          application_count: applicationCount,
          requires_confirmation: true,
        },
        409
      );
    }

    // Detach applications rather than letting them cascade away — the record
    // of who applied survives the vacancy, carrying its title snapshot.
    if (applicationCount > 0) {
      await supabase.from("job_applications").update({ job_id: null }).eq("job_id", id);
    }

    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity(
      "delete",
      "job",
      `Deleted job "${job.title}"${applicationCount ? ` (${applicationCount} application(s) retained)` : ""}`
    );
    return json({ success: true, retained_applications: applicationCount });
  },

  // -------------------------------------------------------------------------
  // Recruitment lookups — job categories, locations, employment types
  //
  // All three follow the same shape: list with a usage count, upsert, toggle
  // active, and a delete that refuses to orphan jobs.
  // -------------------------------------------------------------------------

  "/admin-api/job-categories": async () => {
    const { data, error } = await supabase
      .from("job_categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return json({ error: friendlyDbError(error) }, 400);

    const counts = await countJobsByColumn("category_id");
    const withCounts = (data || []).map((row: any) => ({ ...row, job_count: counts.get(row.id) || 0 }));
    return json({ data: withCounts });
  },

  "/admin-api/job-categories/save": async (_req, body) => {
    const name = String(body?.name || "").trim();
    if (!name) return json({ error: "Category name is required." }, 400);
    if (name.length > 80) return json({ error: "Category name must be 80 characters or fewer." }, 400);

    const fields = {
      name,
      name_hi: emptyToNull(body?.name_hi),
      description: emptyToNull(body?.description),
      slug: await uniqueLookupSlug("job_categories", body?.slug || name, body?.id),
      active: body?.active === undefined ? true : Boolean(body.active),
      display_order: Number.isFinite(Number(body?.display_order)) ? Number(body.display_order) : 0,
    };

    if (await lookupNameTaken("job_categories", name, body?.id)) {
      return json({ error: `A category named "${name}" already exists.` }, 409);
    }

    if (body?.id) {
      const { data, error } = await supabase
        .from("job_categories")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", body.id)
        .select()
        .maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      // Keep the denormalised snapshot on every job in step with the rename.
      await supabase.from("jobs").update({ department: name }).eq("category_id", body.id);
      await logActivity("update", "job_category", `Renamed job category to ${name}`);
      return json({ category: data });
    }

    const { data, error } = await supabase.from("job_categories").insert(fields).select().maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("create", "job_category", `Created job category ${name}`);
    return json({ category: data });
  },

  "/admin-api/job-categories/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);

    const { count } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if ((count || 0) > 0) {
      return json(
        {
          error: `This category is currently being used by ${count} job${count === 1 ? "" : "s"}. Please move those jobs to another category before deleting this category.`,
          job_count: count,
        },
        409
      );
    }

    const { error } = await supabase.from("job_categories").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("delete", "job_category", `Deleted job category ${id}`);
    return json({ success: true });
  },

  "/admin-api/job-locations": async () => {
    const { data, error } = await supabase
      .from("job_locations")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return json({ error: friendlyDbError(error) }, 400);

    const { data: mapRows } = await supabase.from("job_location_map").select("location_id");
    const counts = new Map<string, number>();
    (mapRows || []).forEach((row: any) => counts.set(row.location_id, (counts.get(row.location_id) || 0) + 1));

    const withCounts = (data || []).map((row: any) => ({ ...row, job_count: counts.get(row.id) || 0 }));
    return json({ data: withCounts });
  },

  "/admin-api/job-locations/save": async (_req, body) => {
    const name = String(body?.name || "").trim();
    if (!name) return json({ error: "Location name is required." }, 400);
    if (name.length > 80) return json({ error: "Location name must be 80 characters or fewer." }, 400);

    if (await lookupNameTaken("job_locations", name, body?.id)) {
      return json({ error: `A location named "${name}" already exists.` }, 409);
    }

    const fields = {
      name,
      name_hi: emptyToNull(body?.name_hi),
      slug: await uniqueLookupSlug("job_locations", body?.slug || name, body?.id),
      active: body?.active === undefined ? true : Boolean(body.active),
      display_order: Number.isFinite(Number(body?.display_order)) ? Number(body.display_order) : 0,
    };

    if (body?.id) {
      const { data, error } = await supabase
        .from("job_locations")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", body.id)
        .select()
        .maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);
      await refreshLocationSnapshotsFor(body.id);
      await logActivity("update", "job_location", `Renamed location to ${name}`);
      return json({ location: data });
    }

    const { data, error } = await supabase.from("job_locations").insert(fields).select().maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("create", "job_location", `Created location ${name}`);
    return json({ location: data });
  },

  "/admin-api/job-locations/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);

    const { count } = await supabase
      .from("job_location_map")
      .select("job_id", { count: "exact", head: true })
      .eq("location_id", id);

    if ((count || 0) > 0) {
      return json(
        {
          error: `This location is currently used by ${count} job${count === 1 ? "" : "s"}. Remove it from those jobs, or deactivate it instead of deleting.`,
          job_count: count,
        },
        409
      );
    }

    const { error } = await supabase.from("job_locations").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("delete", "job_location", `Deleted location ${id}`);
    return json({ success: true });
  },

  "/admin-api/employment-types": async () => {
    const { data, error } = await supabase
      .from("employment_types")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return json({ error: friendlyDbError(error) }, 400);

    // employment_type is stored on jobs as a name, not an id.
    const { data: jobRows } = await supabase.from("jobs").select("employment_type");
    const counts = new Map<string, number>();
    (jobRows || []).forEach((row: any) => {
      const key = (row.employment_type || "").toLowerCase();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });

    const withCounts = (data || []).map((row: any) => ({
      ...row,
      job_count: counts.get(String(row.name).toLowerCase()) || 0,
    }));
    return json({ data: withCounts });
  },

  "/admin-api/employment-types/save": async (_req, body) => {
    const name = String(body?.name || "").trim();
    if (!name) return json({ error: "Employment type name is required." }, 400);
    if (name.length > 60) return json({ error: "Employment type must be 60 characters or fewer." }, 400);

    if (await lookupNameTaken("employment_types", name, body?.id)) {
      return json({ error: `An employment type named "${name}" already exists.` }, 409);
    }

    const fields = {
      name,
      slug: await uniqueLookupSlug("employment_types", body?.slug || name, body?.id),
      active: body?.active === undefined ? true : Boolean(body.active),
      display_order: Number.isFinite(Number(body?.display_order)) ? Number(body.display_order) : 0,
    };

    if (body?.id) {
      const { data: previous } = await supabase
        .from("employment_types")
        .select("name")
        .eq("id", body.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("employment_types")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", body.id)
        .select()
        .maybeSingle();
      if (error) return json({ error: friendlyDbError(error) }, 400);

      // Jobs store the name, so a rename has to follow through.
      if (previous?.name && previous.name !== name) {
        await supabase.from("jobs").update({ employment_type: name }).eq("employment_type", previous.name);
      }
      await logActivity("update", "employment_type", `Renamed employment type to ${name}`);
      return json({ employment_type: data });
    }

    const { data, error } = await supabase.from("employment_types").insert(fields).select().maybeSingle();
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("create", "employment_type", `Created employment type ${name}`);
    return json({ employment_type: data });
  },

  "/admin-api/employment-types/delete": async (_req, body) => {
    const { id } = body;
    if (!id) return json({ error: "Missing id" }, 400);

    const { data: row } = await supabase.from("employment_types").select("name").eq("id", id).maybeSingle();
    if (row?.name) {
      const { count } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("employment_type", row.name);
      if ((count || 0) > 0) {
        return json(
          {
            error: `This employment type is currently used by ${count} job${count === 1 ? "" : "s"}. Change those jobs first, or deactivate it instead of deleting.`,
            job_count: count,
          },
          409
        );
      }
    }

    const { error } = await supabase.from("employment_types").delete().eq("id", id);
    if (error) return json({ error: friendlyDbError(error) }, 400);
    await logActivity("delete", "employment_type", `Deleted employment type ${id}`);
    return json({ success: true });
  },

  "/admin-api/settings": async () => {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error) return json({ error: friendlyDbError(error) }, 400);
    const settings: Record<string, string> = {};
    (data || []).forEach((s: any) => { settings[s.key] = s.value; });
    return json({ settings });
  },

  "/admin-api/settings/save": async (_req, body) => {
    const { settings } = body;
    if (!settings || typeof settings !== "object") return json({ error: "Missing settings" }, 400);

    // The careers address is where every CV alert lands — a typo here means
    // applications arrive nowhere, so it is the one field worth validating.
    for (const key of ["careers_email", "email", "careers_recovery_email"]) {
      const value = settings[key];
      if (value === undefined || value === null || String(value).trim() === "") continue;
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(String(value).trim())) {
        return json({ error: `"${String(value).slice(0, 60)}" is not a valid email address.` }, 400);
      }
    }

    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from("site_settings")
        .upsert({ key, value: String(value ?? "").trim(), updated_at: new Date().toISOString() });
    }
    await logActivity("update", "settings", "Updated site settings");
    return json({ success: true });
  },

  /** Lets the settings screen tell the admin whether email will actually send. */
  "/admin-api/mail-status": async () => {
    const transport = configuredTransport();
    return json({
      transport,
      configured: transport !== "none",
      careers_email: await resolveCareersEmailForDisplay(),
    });
  },
};

// Routes that don't require authentication.
//
// The password-recovery endpoints have to be reachable by someone who is
// locked out, so they are rate limited and, crucially, cannot be pointed at an
// attacker-chosen mailbox: the reset link always goes to the address on file.
const publicRoutes = new Set([
  '/admin-api/login',
  '/admin-api/password/reset-request',
  '/admin-api/password/reset-confirm',
  '/admin-api/password/recovery-status',
]);

/**
 * Public pages to rebuild after a successful admin write.
 *
 * Every public route sets `revalidate = 300`, which is what keeps the site
 * quick, but on its own it also means an edit takes up to five minutes to
 * surface — longer on a quiet site, because the first visit after the window
 * elapses still serves the stale page and merely triggers the rebuild in the
 * background. Rebuilding on the write instead makes the change immediate
 * without giving up the cache for ordinary visitors.
 *
 * Paths containing a dynamic segment are passed as the route pattern, which
 * revalidates every generated instance of that route rather than one URL.
 */
const REVALIDATE_ON_WRITE: Array<{ match: RegExp; paths: string[] }> = [
  {
    // Jobs, and the lookups the careers filters are built from.
    match: /^\/admin-api\/(jobs|job-categories|job-locations|employment-types)\b/,
    paths: ['/careers', '/careers/[jobSlug]', '/careers/[jobSlug]/apply'],
  },
];

function revalidateFor(path: string): void {
  for (const { match, paths } of REVALIDATE_ON_WRITE) {
    if (!match.test(path)) continue;
    for (const target of paths) {
      // A bracket means a dynamic segment, which needs the explicit 'page'
      // hint; a literal path does not.
      revalidatePath(target, target.includes('[') ? 'page' : undefined);
    }
  }
}

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

    // Before the auth check, not after: validateSession fails closed on a
    // database error, so a missing service-role key would otherwise answer 401
    // "Unauthorized" — sending whoever is setting the site up to hunt for a
    // password problem that does not exist.
    const configError = adminConfigError();
    if (configError) return json({ error: configError }, 503);

    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const authed = publicRoutes.has(path) || (await validateSession(token));
    if (!authed) return json({ error: 'Unauthorized' }, 401);

    const response = await handler(req as unknown as Request, body, authed);

    // Only on a write that actually succeeded — rebuilding after a rejected
    // save would throw away a good cache entry for nothing.
    if (req.method !== 'GET' && response.ok) revalidateFor(path);

    return response;
  } catch (err: any) {
    // The message is deliberately not returned. It can carry the name of a
    // missing environment variable, a Postgres error with column names, or a
    // stack frame — none of which belongs in a response body. It goes to the
    // server log, where the operator can read it, and the caller gets a
    // sentence they can act on.
    console.error('[admin-api]', err?.message || err);
    const missingConfig = /not configured|SERVICE_ROLE/i.test(String(err?.message || ''));
    return json(
      {
        error: missingConfig
          ? 'The admin portal is not fully configured on this deployment. Please contact your developer.'
          : 'Something went wrong. Please try again.',
      },
      missingConfig ? 503 : 500
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
