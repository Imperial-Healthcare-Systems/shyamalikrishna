import { NextRequest } from 'next/server';
import { getServiceClient, getClientIp, logActivity, withinRateLimit, isServiceConfigured } from '@/lib/server/supabase-admin';
import { validateCv, MAX_CV_BYTES, MAX_CV_MB } from '@/lib/server/cv-upload';
import { notifyApplication } from '@/lib/server/careers-notify';
import { isJobOpen } from '@/lib/types';

/**
 * Public application endpoint.
 *
 * Everything the old client-side form did against the anon key now happens
 * here, for one reason: the browser cannot be trusted to decide whether a job
 * is still accepting applications. A closed job, an expired deadline, a draft
 * that was never published, or a job_id typed straight into devtools all have
 * to be rejected somewhere the applicant cannot reach — which is here.
 *
 * Ordering matters and is deliberate:
 *   1. validate everything, touching no storage
 *   2. upload the CV
 *   3. write the application row  <- the point of no return
 *   4. attempt email
 * The applicant is told "submitted" the moment step 3 lands. Step 4 failing
 * is an operations problem, recorded on the row and retryable from the admin
 * portal — never the applicant's problem, and never a reason to lose a CV.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_APPLICATIONS_PER_IP = 8;
const RATE_WINDOW_MINUTES = 60;
/** Re-submitting the same job with the same email inside this window is treated as a double-click. */
const DUPLICATE_WINDOW_MINUTES = 15;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Trims, drops control characters, and caps length. */
function clean(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== 'string') return '';
  let out = '';
  for (const char of value.normalize('NFKC')) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 && char !== '\n' && char !== '\t') continue;
    if (code === 0x7f) continue;
    out += char;
  }
  return out.trim().slice(0, maxLength);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export async function POST(req: NextRequest) {
  if (!isServiceConfigured()) {
    return json({ error: 'Applications are temporarily unavailable. Please try again later.' }, 503);
  }

  const ip = getClientIp(req);

  // ---- Rate limit -------------------------------------------------------
  const { allowed } = await withinRateLimit('career_application', ip, MAX_APPLICATIONS_PER_IP, RATE_WINDOW_MINUTES);
  if (!allowed) {
    return json({ error: 'Too many applications submitted from this connection. Please try again later.' }, 429);
  }

  // ---- Parse ------------------------------------------------------------
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: 'Could not read the submitted form. Please try again.' }, 400);
  }

  // Silently accept and discard bot submissions that fill the hidden field.
  if (clean(form.get('website_url'), 200)) {
    return json({ success: true, duplicate: false });
  }

  const jobSlug = clean(form.get('job_slug'), 200);
  const isGeneral = !jobSlug || jobSlug === 'general-application';

  const fullName = clean(form.get('full_name'), 120);
  const email = clean(form.get('email'), 254).toLowerCase();
  const phone = clean(form.get('phone'), 32);
  const preferredLocation = clean(form.get('preferred_location'), 120);
  const experience = clean(form.get('years_of_experience'), 80);
  const address = clean(form.get('address'), 500);
  const coverNote = clean(form.get('cover_letter'), 4000);

  // ---- Field validation (never trust the client's own checks) -----------
  if (fullName.length < 2) return json({ error: 'Please enter your full name.' }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: 'Please enter a valid email address.' }, 400);
  if (!validatePhone(phone)) return json({ error: 'Please enter a valid phone number (10–15 digits).' }, 400);

  const supabase = getServiceClient();

  // ---- Job validation ---------------------------------------------------
  let job: {
    id: string;
    title: string;
    slug: string;
    status: string;
    application_deadline: string | null;
    department: string | null;
  } | null = null;
  let jobLocations: string[] = [];

  if (!isGeneral) {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, slug, status, application_deadline, department')
      .eq('slug', jobSlug)
      .maybeSingle();

    if (error) {
      return json({ error: 'Could not verify this position. Please try again.' }, 500);
    }
    if (!data) {
      return json({ error: 'This position is no longer listed.' }, 404);
    }
    if (!isJobOpen(data)) {
      // Covers draft, closed, and expired-deadline in one answer, and does
      // not tell a prober which of the three it was.
      return json({ error: 'This position is no longer accepting applications.' }, 409);
    }
    job = data;

    const { data: mapped } = await supabase
      .from('job_location_map')
      .select('job_locations(name)')
      .eq('job_id', data.id);
    jobLocations = (mapped || [])
      .map((row: { job_locations: { name: string } | { name: string }[] | null }) => {
        const rel = row.job_locations;
        if (!rel) return null;
        return Array.isArray(rel) ? rel[0]?.name : rel.name;
      })
      .filter((name): name is string => Boolean(name));
  }

  // A preferred location must be one the job is actually open in — otherwise
  // the field is just a free-text hole into the admin's inbox.
  if (jobLocations.length > 0) {
    if (!preferredLocation) {
      return json({ error: 'Please select your preferred location.' }, 400);
    }
    const match = jobLocations.find((name) => name.toLowerCase() === preferredLocation.toLowerCase());
    if (!match) {
      return json({ error: 'Please select a preferred location from the list.' }, 400);
    }
  }

  // ---- Duplicate submission --------------------------------------------
  // A double-click, an impatient refresh, or a retried request must not
  // produce two records. Report success against the row that already exists.
  const dupeSince = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000).toISOString();
  let dupeQuery = supabase
    .from('job_applications')
    .select('id')
    .eq('email', email)
    .gte('created_at', dupeSince)
    .limit(1);
  dupeQuery = job ? dupeQuery.eq('job_id', job.id) : dupeQuery.is('job_id', null);

  const { data: existing } = await dupeQuery;
  if (existing && existing.length > 0) {
    return json({ success: true, duplicate: true, id: existing[0].id });
  }

  // ---- CV ---------------------------------------------------------------
  const file = form.get('resume');
  if (!(file instanceof File) || file.size === 0) {
    return json({ error: 'Please attach your CV/resume.' }, 400);
  }
  if (file.size > MAX_CV_BYTES) {
    return json({ error: `File is too large. Maximum size is ${MAX_CV_MB} MB.` }, 413);
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return json({ error: 'Could not read the uploaded file. Please try again.' }, 400);
  }

  const cv = validateCv(file, bytes);
  if (!cv.ok) {
    return json({ error: cv.error }, 400);
  }

  // ---- Store the CV in the private bucket -------------------------------
  const { error: uploadError } = await supabase.storage
    .from('applications')
    .upload(cv.objectPath, cv.bytes, {
      contentType: cv.contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return json({ error: 'Could not upload your CV. Please try again.' }, 500);
  }

  // ---- Commit the application ------------------------------------------
  const { data: inserted, error: insertError } = await supabase
    .from('job_applications')
    .insert({
      job_id: job?.id ?? null,
      job_slug: job?.slug ?? null,
      job_title_snapshot: job?.title ?? 'General Application',
      category_snapshot: job?.department ?? null,
      full_name: fullName,
      email,
      phone,
      preferred_location: preferredLocation || null,
      current_location: preferredLocation || null,
      years_of_experience: experience || null,
      address: address || null,
      cover_letter: coverNote || null,
      resume_url: cv.objectPath,
      resume_filename: cv.displayName,
      status: 'new',
      is_general: isGeneral,
      notification_status: 'pending',
    })
    .select('id')
    .maybeSingle();

  if (insertError || !inserted) {
    // Nothing was committed — clean up the orphaned object rather than
    // leaving a CV in the bucket with no record pointing at it.
    try {
      await supabase.storage.from('applications').remove([cv.objectPath]);
    } catch {
      // best effort
    }
    return json({ error: 'Could not submit your application. Please try again.' }, 500);
  }

  await logActivity('career_application', ip, `Application ${inserted.id} for ${job?.title || 'general'}`);

  // ---- Notify (never allowed to affect the answer) ----------------------
  try {
    await notifyApplication(inserted.id, req);
  } catch {
    // notifyApplication records its own failure on the row.
  }

  return json({ success: true, duplicate: false, id: inserted.id });
}

/** Anything other than POST is not a thing here. */
export async function GET() {
  return json({ error: 'Method not allowed' }, 405);
}
