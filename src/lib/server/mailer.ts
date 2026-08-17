import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Outbound email for the recruitment system.
 *
 * Two transports, chosen from the environment at call time:
 *
 *   SMTP    — set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD. This is
 *             the path most small businesses want: the credentials are the
 *             same ones already used for info@shyamalikrishna.com.
 *   Resend  — set RESEND_API_KEY. Useful on hosts that block outbound SMTP.
 *
 * If neither is configured the send is *skipped*, not failed: the application
 * has already been written to the database by the time we get here, and an
 * unconfigured mailbox must never look to the applicant like a lost CV.
 *
 * Nothing in this module is imported by client code — credentials are read
 * from server-only env vars and never reach the browser.
 */

export type MailTransport = 'smtp' | 'resend' | 'none';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}

export interface MailResult {
  ok: boolean;
  transport: MailTransport;
  /** Present only on failure. Safe to store; never shown to the applicant. */
  error?: string;
}

export function configuredTransport(): MailTransport {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) return 'smtp';
  return 'none';
}

export function isMailConfigured(): boolean {
  return configuredTransport() !== 'none';
}

/** The envelope sender. Must be an address the transport is allowed to send as. */
function fromAddress(): string {
  return (
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    'Shyamali Krishna Careers <no-reply@shyamalikrishna.com>'
  );
}

let cachedTransporter: Transporter | null = null;

function smtpTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;
  const port = Number(process.env.SMTP_PORT || 587);
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return cachedTransporter;
}

async function sendViaSmtp(message: MailMessage): Promise<MailResult> {
  await smtpTransporter().sendMail({
    from: fromAddress(),
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
  return { ok: true, transport: 'smtp' };
}

async function sendViaResend(message: MailMessage): Promise<MailResult> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [message.to],
      reply_to: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64'),
        content_type: a.contentType,
      })),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 300)}`);
  }
  return { ok: true, transport: 'resend' };
}

/**
 * Sends a message. Never throws — the caller records the outcome and carries
 * on, because every caller has already committed the thing that matters.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const transport = configuredTransport();
  if (transport === 'none') {
    return { ok: false, transport: 'none', error: 'No mail transport configured (set SMTP_* or RESEND_API_KEY).' };
  }
  if (!message.to) {
    return { ok: false, transport, error: 'No recipient address configured.' };
  }

  try {
    return transport === 'resend' ? await sendViaResend(message) : await sendViaSmtp(message);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, transport, error: detail.slice(0, 500) };
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

/** Applicant-supplied strings land in an HTML email — escape all of them. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ApplicationEmailFields {
  applicationId: string;
  applicantName: string;
  email: string;
  phone: string;
  position: string;
  category: string | null;
  preferredLocation: string | null;
  experience: string | null;
  address: string | null;
  coverNote: string | null;
  appliedAt: string;
  adminUrl: string;
}

const BRAND_CHARCOAL = '#1A1A1A';
const BRAND_GOLD = '#B8860B';
const BRAND_BONE = '#E8E4DB';

export function applicationEmail(fields: ApplicationEmailFields): { subject: string; html: string; text: string } {
  const subject = `New Career Application — ${fields.position} — ${fields.applicantName}`;

  const rows: Array<[string, string | null]> = [
    ['Applicant Name', fields.applicantName],
    ['Email', fields.email],
    ['Phone', fields.phone],
    ['Position', fields.position],
    ['Category', fields.category],
    ['Preferred Location', fields.preferredLocation],
    ['Experience', fields.experience],
    ['Address', fields.address],
    ['Cover Note', fields.coverNote],
    ['Application Date', fields.appliedAt],
  ];

  const visible = rows.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');

  const htmlRows = visible
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid ${BRAND_BONE};color:#6B6B6B;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 16px;border-bottom:1px solid ${BRAND_BONE};color:${BRAND_CHARCOAL};font-size:14px;">${escapeHtml(value).replace(/\n/g, '<br>')}</td>
        </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF8F3;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid ${BRAND_BONE};">
        <tr>
          <td style="background:${BRAND_CHARCOAL};padding:24px;">
            <div style="color:${BRAND_GOLD};font-size:11px;letter-spacing:2px;text-transform:uppercase;">New Career Application</div>
            <div style="color:#FAF8F3;font-size:22px;margin-top:8px;">${escapeHtml(fields.position)}</div>
            <div style="color:rgba(250,248,243,0.7);font-size:14px;margin-top:4px;">${escapeHtml(fields.applicantName)}</div>
          </td>
        </tr>
        <tr><td style="padding:8px 8px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${htmlRows}</table>
        </td></tr>
        <tr><td style="padding:20px 24px 24px;">
          <a href="${escapeHtml(fields.adminUrl)}" style="display:inline-block;background:${BRAND_GOLD};color:#ffffff;padding:12px 20px;text-decoration:none;font-size:14px;">Open in admin portal</a>
          <p style="color:#6B6B6B;font-size:12px;margin:16px 0 0;">The applicant's CV is attached to this email. Reference: ${escapeHtml(fields.applicationId)}</p>
        </td></tr>
      </table>
      <p style="color:#6B6B6B;font-size:11px;margin:16px 0 0;">Shyamali Krishna Automobile Private Limited &middot; Nawada, Bihar</p>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `New Career Application — ${fields.position}`,
    '',
    ...visible.map(([label, value]) => `${label}: ${value}`),
    '',
    `Open in admin portal: ${fields.adminUrl}`,
    `Reference: ${fields.applicationId}`,
    '',
    'The applicant CV is attached.',
  ].join('\n');

  return { subject, html, text };
}

export function passwordResetEmail(resetUrl: string, expiryMinutes: number, requestedFromIp: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Admin password reset — Shyamali Krishna Automobile';

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF8F3;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND_BONE};">
        <tr><td style="background:${BRAND_CHARCOAL};padding:24px;">
          <div style="color:${BRAND_GOLD};font-size:11px;letter-spacing:2px;text-transform:uppercase;">Admin Portal</div>
          <div style="color:#FAF8F3;font-size:22px;margin-top:8px;">Password reset requested</div>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="color:${BRAND_CHARCOAL};font-size:14px;line-height:1.6;margin:0 0 20px;">
            Someone asked to reset the administrator password for the Shyamali Krishna Automobile website.
            Use the button below to choose a new one. The link works once and expires in ${expiryMinutes} minutes.
          </p>
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:${BRAND_GOLD};color:#ffffff;padding:12px 22px;text-decoration:none;font-size:14px;">Choose a new password</a>
          <p style="color:#6B6B6B;font-size:12px;line-height:1.6;margin:20px 0 0;">
            If the button does not work, copy this link into your browser:<br>
            <span style="word-break:break-all;color:${BRAND_CHARCOAL};">${escapeHtml(resetUrl)}</span>
          </p>
          <p style="color:#6B6B6B;font-size:12px;line-height:1.6;margin:20px 0 0;border-top:1px solid ${BRAND_BONE};padding-top:16px;">
            Requested from IP ${escapeHtml(requestedFromIp)}. If this was not you, no action is needed —
            the current password stays valid until this link is used.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    'Password reset requested — Shyamali Krishna Automobile admin portal',
    '',
    `Open this link to choose a new password (valid once, expires in ${expiryMinutes} minutes):`,
    resetUrl,
    '',
    `Requested from IP ${requestedFromIp}.`,
    'If this was not you, no action is needed — the current password stays valid until this link is used.',
  ].join('\n');

  return { subject, html, text };
}
