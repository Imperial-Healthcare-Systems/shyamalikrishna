'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import { AdminCard, Alert, PageHeading, INPUT, LABEL, HINT, BTN_PRIMARY } from '@/views/admin/ui';

const BUSINESS_FIELDS = [
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
  { key: 'legal_name', label: 'Legal Name', type: 'text' },
  { key: 'office_line1', label: 'Office Line 1', type: 'text' },
  { key: 'office_line2', label: 'Office Line 2', type: 'text' },
  { key: 'office_line3', label: 'Office Line 3', type: 'text' },
  { key: 'office_line4', label: 'Office Line 4', type: 'text' },
  { key: 'gst', label: 'GST', type: 'text' },
  { key: 'hours_weekday', label: 'Weekday Hours', type: 'text' },
  { key: 'hours_sunday', label: 'Sunday Hours', type: 'text' },
  { key: 'maps_query', label: 'Maps Query', type: 'text' },
];

interface MailStatus {
  transport: 'smtp' | 'resend' | 'none';
  configured: boolean;
  careers_email: string;
}

export function AdminSettings() {
  const { token, logout } = useAdminAuth();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [mail, setMail] = useState<MailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordDone, setPasswordDone] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const [settingsResult, mailResult] = await Promise.all([
      adminFetch('/admin-api/settings', { token }),
      adminFetch('/admin-api/mail-status', { token }),
    ]);
    if (settingsResult.ok) setSettings(settingsResult.data.settings || {});
    if (mailResult.ok) setMail(mailResult.data as MailStatus);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    setSavedNotice(null);
    const result = await adminFetch('/admin-api/settings/save', {
      method: 'POST',
      body: { settings },
      token,
    });
    setSaving(false);
    if (result.ok) {
      setSavedNotice('Settings saved. The public site picks up changes within about five minutes.');
      load();
    } else {
      setSaveError(result.data?.error || 'Could not save the settings.');
    }
  };

  const changePassword = async () => {
    if (!token) return;
    setPasswordError(null);

    if (!currentPassword || !newPassword) {
      setPasswordError('Enter your current password and the new one.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('The new password must be at least 8 characters long.');
      return;
    }

    setPasswordBusy(true);
    const result = await adminFetch('/admin-api/password/change', {
      method: 'POST',
      body: {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      token,
    });
    setPasswordBusy(false);

    if (!result.ok) {
      setPasswordError(result.data?.error || 'Could not change the password.');
      return;
    }

    setPasswordDone(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    // Changing the password invalidates every other session, including this
    // browser's — send the admin back to the login screen with the new one.
    setTimeout(() => logout(), 2500);
  };

  if (loading) return <LoadingSpinner label="Loading settings…" />;

  const effectiveCareersEmail = settings.careers_email?.trim() || settings.email?.trim() || 'info@shyamalikrishna.com';

  return (
    <div className="space-y-6">
      <PageHeading title="Settings" subtitle="Business information, recruitment email, and your password" />

      {savedNotice && <Alert tone="success" onDismiss={() => setSavedNotice(null)}>{savedNotice}</Alert>}
      {saveError && <Alert tone="error" onDismiss={() => setSaveError(null)}>{saveError}</Alert>}

      {/* Careers email */}
      <AdminCard
        title="Career Application Email"
        description="Where every new application alert and CV is delivered."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL} htmlFor="careers-email">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Recruitment inbox
              </span>
            </label>
            <input
              id="careers-email"
              type="email"
              value={settings.careers_email || ''}
              onChange={(e) => setSettings({ ...settings, careers_email: e.target.value })}
              className={INPUT}
              placeholder={settings.email || 'info@shyamalikrishna.com'}
            />
            <p className={HINT}>
              Leave blank to use the general business email below. Currently sending to{' '}
              <strong className="text-gray-700">{effectiveCareersEmail}</strong>.
            </p>
          </div>

          <div>
            <label className={LABEL} htmlFor="recovery-email">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Password recovery inbox
              </span>
            </label>
            <input
              id="recovery-email"
              type="email"
              value={settings.careers_recovery_email || ''}
              onChange={(e) => setSettings({ ...settings, careers_recovery_email: e.target.value })}
              className={INPUT}
              placeholder="info@shyamalikrishna.com"
            />
            <p className={HINT}>
              Reset links are only ever sent here — never to an address typed on the login screen.
            </p>
          </div>
        </div>

        {mail && !mail.configured && (
          <div className="mt-4">
            <Alert tone="warning">
              <strong>Email is not configured on this deployment.</strong> Applications will still be saved
              safely and CVs stored, but no alert will be sent and password recovery will not work. Your
              developer needs to set <code className="font-mono text-xs">SMTP_HOST</code>,{' '}
              <code className="font-mono text-xs">SMTP_USER</code> and{' '}
              <code className="font-mono text-xs">SMTP_PASSWORD</code> (or{' '}
              <code className="font-mono text-xs">RESEND_API_KEY</code>) in the hosting environment.
            </Alert>
          </div>
        )}
        {mail && mail.configured && (
          <div className="mt-4">
            <Alert tone="success">
              Email is working via <strong>{mail.transport === 'smtp' ? 'SMTP' : 'Resend'}</strong>.
            </Alert>
          </div>
        )}

        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
          <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save email settings'}
          </button>
        </div>
      </AdminCard>

      {/* Business info */}
      <AdminCard title="Business Information" description="Used across the public website — header, footer and contact page.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BUSINESS_FIELDS.map((field) => (
            <div key={field.key}>
              <label className={LABEL} htmlFor={`setting-${field.key}`}>{field.label}</label>
              <input
                id={`setting-${field.key}`}
                type={field.type}
                value={settings[field.key] || ''}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                className={INPUT}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
          <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </AdminCard>

      {/* Password */}
      <AdminCard title="Administrator Password" description="Only the signed-in administrator can change this.">
        {passwordDone ? (
          <Alert tone="success">
            Password changed. For safety, every signed-in session has been ended — you will be returned to the
            login screen in a moment. Sign in again with your new password.
          </Alert>
        ) : (
          <>
            {passwordError && (
              <div className="mb-4">
                <Alert tone="error">{passwordError}</Alert>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={LABEL} htmlFor="pw-current">
                  Current password <span className="text-red-600">*</span>
                </label>
                <input
                  id="pw-current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={INPUT}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="pw-new">
                  New password <span className="text-red-600">*</span>
                </label>
                <input
                  id="pw-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={INPUT}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="pw-confirm">
                  Confirm new password <span className="text-red-600">*</span>
                </label>
                <input
                  id="pw-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={INPUT}
                  autoComplete="new-password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
                )}
              </div>
            </div>

            <p className={`${HINT} mt-3`}>
              At least 8 characters, including a letter and a number. Obvious passwords are rejected.
            </p>

            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
              <button type="button" onClick={changePassword} disabled={passwordBusy} className={BTN_PRIMARY}>
                {passwordBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {passwordBusy ? 'Changing…' : 'Change password'}
              </button>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
