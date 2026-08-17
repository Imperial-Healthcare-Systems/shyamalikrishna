/**
 * Verifies that the admin portal can actually work.
 *
 * `npm run check-env` only asks "is this variable non-empty". The three things
 * that actually go wrong during setup are subtler than that, and each one
 * produces a different confusing symptom later:
 *
 *   1. the key is blank          -> 503 at login
 *   2. the ANON key was pasted   -> looks correct, decodes fine, then every
 *                                   admin write silently fails on RLS
 *   3. the migration never ran   -> login works, then Jobs/Applications error
 *
 * Run:  npm run check-admin
 */

import { existsSync, readFileSync } from 'node:fs';

for (const file of ['.env.local', '.env.production', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '').trim();
    if (value && !process.env[m[1]]) process.env[m[1]] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.env.ADMIN_PASSWORD;

let failed = false;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m, fix) => {
  failed = true;
  console.log(`  ✗ ${m}`);
  if (fix) console.log(`      ${fix.split('\n').join('\n      ')}`);
};

console.log('\nAdmin portal configuration\n');

// --- 1. Supabase URL -------------------------------------------------------
if (url) ok(`Supabase URL: ${url}`);
else bad('NEXT_PUBLIC_SUPABASE_URL is missing', 'This normally lives in .env — check that file exists.');

// --- 2. Service-role key ---------------------------------------------------
/** Supabase JWTs carry both the role and the project ref they belong to. */
function decodeJwt(jwt) {
  try {
    const payload = jwt.split('.')[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function decodeRole(jwt) {
  return decodeJwt(jwt)?.role || null;
}

/** The project ref is the subdomain: https://<ref>.supabase.co */
function refFromUrl(u) {
  try {
    return new URL(u).hostname.split('.')[0];
  } catch {
    return null;
  }
}

/**
 * Catches the mistake that produces a bare "Invalid API key": the URL points at
 * one project and the key was issued by another. Decoding the ref out of the
 * token names the right project instead of leaving it to trial and error.
 */
function checkProjectRefs() {
  const urlRef = refFromUrl(url);
  const secretClaims = serviceKey ? decodeJwt(serviceKey) : null;
  const anonClaims = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? decodeJwt(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : null;

  if (!urlRef || !secretClaims?.ref) return; // new-format keys carry no ref

  if (secretClaims.ref !== urlRef) {
    bad(
      `Key/URL project mismatch: URL is "${urlRef}", secret key belongs to "${secretClaims.ref}"`,
      `Set NEXT_PUBLIC_SUPABASE_URL=https://${secretClaims.ref}.supabase.co in .env\n` +
        `and replace NEXT_PUBLIC_SUPABASE_ANON_KEY with that project's anon key.\n` +
        'All three values must come from the same project.'
    );
  } else if (anonClaims?.ref && anonClaims.ref !== urlRef) {
    bad(
      `The anon key belongs to project "${anonClaims.ref}" but the URL is "${urlRef}"`,
      "Replace NEXT_PUBLIC_SUPABASE_ANON_KEY with the anon key from the URL's project."
    );
  } else {
    ok(`URL and keys all belong to project "${urlRef}"`);
  }
}

if (!serviceKey) {
  bad(
    'SUPABASE_SERVICE_ROLE_KEY is EMPTY',
    'Supabase Dashboard -> Settings -> API -> Project API keys -> service_role -> Reveal.\n' +
      'Paste it into .env.local after the "=" with no quotes and no spaces,\n' +
      'then RESTART the dev server (Ctrl+C, then npm run dev).'
  );
} else {
  const role = decodeRole(serviceKey);
  if (role === 'service_role') {
    ok('SUPABASE_SERVICE_ROLE_KEY looks like a service_role key');
  } else if (role === 'anon') {
    bad(
      'SUPABASE_SERVICE_ROLE_KEY contains the ANON key, not the service_role key',
      'These sit next to each other on the Supabase API page and look identical.\n' +
        'Copy the one labelled "service_role" (you must click Reveal first).'
    );
  } else if (role) {
    bad(`SUPABASE_SERVICE_ROLE_KEY decodes to role "${role}", expected "service_role"`);
  } else {
    // Newer Supabase projects issue non-JWT secret keys (sb_secret_...).
    if (serviceKey.startsWith('sb_secret_')) ok('SUPABASE_SERVICE_ROLE_KEY looks like a Supabase secret key');
    else bad('SUPABASE_SERVICE_ROLE_KEY is not a readable key', 'Re-copy it — it may have been truncated or line-wrapped.');
  }
}

// --- 3. Do the URL and both keys belong to the same project? ---------------
if (url && serviceKey) checkProjectRefs();

// --- 4. Admin password -----------------------------------------------------
if (adminPassword) ok(`ADMIN_PASSWORD is set (${adminPassword.length} characters)`);
else bad('ADMIN_PASSWORD is missing', 'Add ADMIN_PASSWORD=<your password> to .env.local, then restart the dev server.');

// --- 4. Live checks --------------------------------------------------------
if (url && serviceKey) {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  // Can the key actually write? admin_sessions is what login needs.
  try {
    const res = await fetch(`${url}/rest/v1/admin_sessions?select=token&limit=1`, { headers });
    if (res.ok) {
      ok('The key can reach admin_sessions (login will work)');
    } else {
      const body = await res.json().catch(() => ({}));
      const reason = body.message || `HTTP ${res.status}`;

      // "Invalid API key" has two very different causes, and telling them
      // apart saves a lot of pointless re-copying. If the PUBLIC key still
      // works against this URL, the project is fine and it is the secret key
      // that belongs somewhere else — i.e. the URL and the key are from two
      // different Supabase projects.
      let mismatch = false;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (anon && /invalid api key/i.test(reason)) {
        try {
          const probe = await fetch(`${url}/rest/v1/categories?select=id&limit=1`, {
            headers: { apikey: anon, Authorization: `Bearer ${anon}` },
          });
          mismatch = probe.ok;
        } catch {
          mismatch = false;
        }
      }

      if (mismatch) {
        bad(
          'The secret key belongs to a DIFFERENT Supabase project than the URL',
          `NEXT_PUBLIC_SUPABASE_URL still points at:\n  ${url}\n` +
            'but SUPABASE_SERVICE_ROLE_KEY came from another project.\n\n' +
            'If you created a new project, update ALL THREE together in .env / .env.local:\n' +
            '  NEXT_PUBLIC_SUPABASE_URL        (new Project URL)\n' +
            '  NEXT_PUBLIC_SUPABASE_ANON_KEY   (new anon / publishable key)\n' +
            '  SUPABASE_SERVICE_ROLE_KEY       (new service_role / secret key)\n' +
            'They must all come from the same project.'
        );
      } else {
        bad(`The key was rejected by Supabase: ${reason}`, 'Re-copy the service_role / secret key.');
      }
    }
  } catch (err) {
    bad(`Could not reach Supabase: ${err.message}`);
  }

  // Has the recruitment migration been run?
  const required = ['job_categories', 'job_locations', 'employment_types', 'job_location_map', 'admin_credentials'];
  const missing = [];
  for (const table of required) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
      if (!res.ok) missing.push(table);
    } catch {
      missing.push(table);
    }
  }
  if (missing.length === 0) ok('Recruitment migration has been run (all tables present)');
  else
    bad(
      `Recruitment migration NOT run — missing: ${missing.join(', ')}`,
      'Supabase Dashboard -> SQL Editor -> New query.\n' +
        'Paste all of supabase/migrations/0001_recruitment_system.sql and run it.\n' +
        'Login still works without this, but Jobs/Applications/Categories will error.'
    );
}

// --- 5. Email --------------------------------------------------------------
const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;
if (hasSmtp || process.env.RESEND_API_KEY) {
  ok(`Email configured via ${process.env.RESEND_API_KEY ? 'Resend' : 'SMTP'}`);
} else {
  console.log('  - Email not configured (optional)');
  console.log('      Applications and CVs are still saved; nobody is emailed until this is set,');
  console.log('      and admin password recovery stays unavailable.');
}

console.log(
  failed
    ? '\nNot ready yet — fix the ✗ items above, then run this again.\n'
    : '\nAdmin portal is ready. Sign in at /admin with your password.\n'
);
process.exit(failed ? 1 : 0);
