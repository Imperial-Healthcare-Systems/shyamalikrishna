/**
 * Preflight for `npm run build`.
 *
 * Pages are prerendered with real Supabase data, so the build itself queries
 * the database. Without these variables the build dies partway through static
 * generation on an arbitrary page, which reads like a page bug rather than a
 * configuration problem. Fail immediately and say exactly what is missing.
 */

import { existsSync, readFileSync } from 'node:fs';

// Hosts like Vercel inject variables straight into the process environment,
// but a local `npm run build` gets them from .env files that Next reads
// itself — this script runs under plain node, so load them here too.
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (value && !process.env[m[1]]) process.env[m[1]] = value;
  }
}

const REQUIRED_AT_BUILD = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const REQUIRED_AT_RUNTIME = ['SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_PASSWORD'];

const missingBuild = REQUIRED_AT_BUILD.filter((k) => !process.env[k]);
const missingRuntime = REQUIRED_AT_RUNTIME.filter((k) => !process.env[k]);

if (missingRuntime.length) {
  console.warn(
    `\n⚠  ${missingRuntime.join(', ')} not set — the site will build and all public\n` +
      `   pages will work, but /admin will return a configuration error.\n`
  );
}

if (missingBuild.length) {
  console.error(
    `\n✖ Build cannot start: ${missingBuild.join(', ')} missing.\n\n` +
      `  These are read during the build, not just at runtime, because route\n` +
      `  segments prerender with live data.\n\n` +
      `  Local:  copy .env.example to .env.local and fill it in.\n` +
      `  Vercel: Project > Settings > Environment Variables. Tick Production,\n` +
      `          Preview AND Development, then trigger a NEW deployment —\n` +
      `          existing deployments do not pick up variables added later.\n`
  );
  process.exit(1);
}

console.log('✓ env preflight passed');
