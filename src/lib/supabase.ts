import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// The admin API is now a Next route handler in this app, not an edge function.
const ADMIN_API_BASE = '/api/admin';

/**
 * Built on first use rather than at module load.
 *
 * `next build` imports every route module to collect its configuration. A
 * throw at module scope therefore fails the whole build — including routes
 * that never touch the database — with an error pointing at the wrong place.
 * Deferring means a missing variable surfaces where it is actually used, and
 * only for the routes that read data.
 */
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment (they are ' +
        'needed at build time, because pages are prerendered with real data).'
    );
  }

  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => (getClient() as any)[prop],
});

export const ADMIN_API_URL = ADMIN_API_BASE;

export async function adminFetch(
  path: string,
  options: { method?: string; body?: unknown; token?: string; searchParams?: Record<string, string> } = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const { method = 'GET', body, token, searchParams } = options;
  // Route-map keys still carry the /admin-api prefix; strip it for the URL.
  let url = `${ADMIN_API_BASE}${path.replace(/^\/admin-api/, '')}`;
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    const text = await response.text();
    return { ok: response.ok, status: response.status, data: text };
  }

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}
