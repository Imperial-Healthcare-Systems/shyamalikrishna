import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client, shared by the admin API and the public
 * application endpoint.
 *
 * Built lazily: `next build` imports every route module to collect its
 * configuration, and creating this at module scope would throw during the
 * build on a machine that (correctly) has no production secrets.
 *
 * The service-role key bypasses RLS entirely, so this module must never be
 * imported from anything that runs in the browser.
 */

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Server is not configured: set SUPABASE_SERVICE_ROLE_KEY.');
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export function isServiceConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Best-effort audit trail. Never allowed to fail a request. */
export async function logActivity(action: string, entityType: string, description: string): Promise<void> {
  try {
    await getServiceClient().from('admin_activity').insert({
      action,
      entity_type: entityType,
      description: description.slice(0, 500),
    });
  } catch {
    // logging is advisory
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 64);
  return req.headers.get('x-real-ip')?.slice(0, 64) || 'unknown';
}

/**
 * Counts how many times `action` was logged for `key` inside the window.
 * Reuses admin_activity rather than adding a table — the volumes here are
 * a handful of rows a day, and it keeps the audit trail in one place.
 */
export async function withinRateLimit(
  action: string,
  key: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; attempts: number }> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const { count } = await getServiceClient()
      .from('admin_activity')
      .select('id', { count: 'exact', head: true })
      .eq('action', action)
      .eq('entity_type', key)
      .gte('created_at', windowStart);
    const attempts = count || 0;
    return { allowed: attempts < maxAttempts, attempts };
  } catch {
    // A failure to *read* the limiter must not lock legitimate users out.
    return { allowed: true, attempts: 0 };
  }
}

/** The origin the site is served from, used to build absolute links in email. */
export function siteOrigin(req?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (req) {
    try {
      return new URL(req.url).origin;
    } catch {
      // fall through
    }
  }
  return 'https://www.shyamalikrishna.com';
}
