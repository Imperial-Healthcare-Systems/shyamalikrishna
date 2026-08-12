import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The admin API is now a Next route handler in this app, not an edge function.
const ADMIN_API_BASE = '/api/admin';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
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
