/**
 * Exports every row the site owns into a runnable SQL seed file.
 *
 * Reads with the public anon key, so it needs no secrets and works for as long
 * as the current Supabase project is reachable. Run it before migrating to a
 * new project, or just periodically as a backup.
 *
 *   npm run export-data
 *
 * Output: supabase/seed/0002_data_export.sql
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '').trim();
    if (value && !process.env[m[1]]) process.env[m[1]] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The service-role key is used when present so empty/RLS-protected tables are
// included too; the anon key is enough for all public content.
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / key. Nothing to export.');
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

/** Insert order matters — parents before the rows that reference them. */
const TABLES = [
  'site_settings',
  'categories',
  'partners',
  'products',
  'services',
  'resources',
  'faqs',
  'job_categories',
  'job_locations',
  'employment_types',
  'jobs',
  'job_location_map',
  'job_applications',
  'leads',
  'lead_notes',
];

/** Postgres literal for any JS value coming back from PostgREST. */
function sqlValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    // text[] columns such as products.gallery_images
    const inner = value.map((v) => String(v).split('\\').join('\\\\').split('"').join('\\"')).join('","');
    return `'{"${inner}"}'`;
  }
  if (typeof value === 'object') return `'${JSON.stringify(value).split("'").join("''")}'::jsonb`;
  return `'${String(value).split("'").join("''")}'`;
}

async function fetchAll(table) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=${pageSize}&offset=${from}`, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message || `HTTP ${res.status}` };
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return { ok: true, rows };
}

const out = [];
out.push('-- ============================================================================');
out.push('-- Shyamali Krishna Automobile — data export');
out.push(`-- Source: ${url}`);
out.push('--');
out.push('-- Runnable seed for a fresh Supabase project. Run AFTER the schema migration');
out.push('-- that creates these tables. Every statement is ON CONFLICT DO NOTHING, so');
out.push('-- re-running it will not duplicate or overwrite anything.');
out.push('-- ============================================================================');
out.push('');
out.push('begin;');
out.push('');

const summary = [];

for (const table of TABLES) {
  const result = await fetchAll(table);

  if (!result.ok) {
    summary.push({ table, count: '-', note: result.error.slice(0, 48) });
    out.push(`-- ${table}: skipped (${result.error.slice(0, 60)})`);
    out.push('');
    continue;
  }

  summary.push({ table, count: result.rows.length, note: '' });

  if (result.rows.length === 0) {
    out.push(`-- ${table}: no rows`);
    out.push('');
    continue;
  }

  const columns = Object.keys(result.rows[0]);
  const conflictTarget = table === 'site_settings' ? '(key)' : columns.includes('id') ? '(id)' : '';

  out.push(`-- ${table}: ${result.rows.length} row(s)`);
  for (const row of result.rows) {
    const values = columns.map((c) => sqlValue(row[c])).join(', ');
    out.push(
      `insert into public.${table} (${columns.join(', ')}) values (${values})` +
        `${conflictTarget ? ` on conflict ${conflictTarget} do nothing` : ''};`
    );
  }
  out.push('');
}

out.push('commit;');
out.push('');

mkdirSync('supabase/seed', { recursive: true });
const target = 'supabase/seed/0002_data_export.sql';
writeFileSync(target, out.join('\n'));

console.log(`\nExported from ${url}\n`);
for (const row of summary) {
  console.log(`  ${String(row.table).padEnd(20)} ${String(row.count).padStart(5)}  ${row.note}`);
}
console.log(`\nWritten to ${target}\n`);
