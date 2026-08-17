import { getServiceClient, siteOrigin } from '@/lib/server/supabase-admin';
import { sendMail, applicationEmail, isMailConfigured } from '@/lib/server/mailer';
import { formatDateTime } from '@/lib/utils';

/**
 * Application notification, shared by the public submit route and the admin
 * "Resend notification" action so both take exactly the same path.
 *
 * The contract everywhere: the application row is already committed before
 * this runs. Whatever happens here is recorded on the row and never surfaced
 * to the applicant.
 */

const FALLBACK_RECIPIENT = 'info@shyamalikrishna.com';

/** Recipient for new application alerts, editable at /admin/settings. */
export async function resolveCareersEmail(): Promise<string> {
  try {
    const { data } = await getServiceClient()
      .from('site_settings')
      .select('key, value')
      .in('key', ['careers_email', 'email']);

    const map = new Map((data || []).map((row: { key: string; value: string }) => [row.key, row.value]));
    const chosen = (map.get('careers_email') || map.get('email') || '').trim();
    return chosen || FALLBACK_RECIPIENT;
  } catch {
    return FALLBACK_RECIPIENT;
  }
}

/**
 * Recipient for admin password recovery.
 *
 * Deliberately NOT taken from the request: a reset link must only ever be
 * deliverable to the address already on file, otherwise anyone could point it
 * at a mailbox they control. Falls back to the hard-coded company address.
 */
export async function resolveRecoveryEmail(): Promise<string> {
  try {
    const { data } = await getServiceClient()
      .from('site_settings')
      .select('key, value')
      .in('key', ['careers_recovery_email', 'email']);

    const map = new Map((data || []).map((row: { key: string; value: string }) => [row.key, row.value]));
    const chosen = (map.get('careers_recovery_email') || map.get('email') || '').trim();
    return chosen || FALLBACK_RECIPIENT;
  } catch {
    return FALLBACK_RECIPIENT;
  }
}

export interface NotifyResult {
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

/** Downloads the stored CV so it can ride along as an attachment. */
async function fetchCv(objectPath: string | null): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!objectPath) return null;
  try {
    // Rows written before the bucket was private stored a full public URL.
    let path = objectPath;
    if (path.startsWith('http')) {
      const marker = '/applications/';
      const idx = path.indexOf(marker);
      if (idx === -1) return null;
      path = path.slice(idx + marker.length);
    }
    const { data, error } = await getServiceClient().storage.from('applications').download(path);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    return { buffer, contentType: data.type || 'application/octet-stream' };
  } catch {
    return null;
  }
}

/**
 * Sends (or re-sends) the notification for one application and records the
 * outcome on the row. Returns the recorded status; never throws.
 */
export async function notifyApplication(applicationId: string, req?: Request): Promise<NotifyResult> {
  const supabase = getServiceClient();

  const { data: app, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (error || !app) {
    return { status: 'failed', error: 'Application not found.' };
  }

  const stamp = async (status: NotifyResult['status'], message?: string) => {
    await supabase
      .from('job_applications')
      .update({
        notification_status: status,
        notification_attempts: (app.notification_attempts || 0) + 1,
        notification_last_attempt_at: new Date().toISOString(),
        notification_error: message ? message.slice(0, 500) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);
  };

  if (!isMailConfigured()) {
    const message = 'No mail transport configured (set SMTP_* or RESEND_API_KEY).';
    await stamp('skipped', message);
    return { status: 'skipped', error: message };
  }

  const recipient = await resolveCareersEmail();
  const origin = siteOrigin(req);

  const cv = await fetchCv(app.resume_url);
  const template = applicationEmail({
    applicationId: app.id,
    applicantName: app.full_name,
    email: app.email,
    phone: app.phone,
    position: app.job_title_snapshot || app.job_slug || 'General Application',
    category: app.category_snapshot,
    preferredLocation: app.preferred_location,
    experience: app.years_of_experience,
    address: app.address,
    coverNote: app.cover_letter,
    appliedAt: formatDateTime(app.created_at),
    adminUrl: `${origin}/admin/applications/${app.id}`,
  });

  const result = await sendMail({
    to: recipient,
    // Replying to the alert reaches the candidate directly.
    replyTo: app.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: cv
      ? [
          {
            filename: app.resume_filename || `CV-${app.full_name}.pdf`,
            content: cv.buffer,
            contentType: cv.contentType,
          },
        ]
      : undefined,
  });

  if (result.ok) {
    await stamp('sent');
    return { status: 'sent' };
  }

  await stamp('failed', result.error);
  return { status: 'failed', error: result.error };
}
