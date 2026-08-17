'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useSEO } from '@/lib/seo';

/**
 * Consumes a single-use reset token from the emailed link.
 *
 * Note what is NOT here: the token is never used to sign anyone in, and the new
 * password is never echoed back. The token is spent on the server the moment a
 * password is accepted, and every existing session is dropped, so the admin has
 * to sign in again with the new password.
 */
export function AdminResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useSEO({
    title: 'Reset Admin Password',
    description: 'Set a new administrator password.',
    canonical: 'https://www.shyamalikrishna.com/admin/reset-password',
    hreflang: false,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');

    if (newPassword !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('The password must be at least 8 characters long.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/admin/password/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword, confirm_password: confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.success) {
        setDone(true);
        setTimeout(() => router.replace('/admin'), 3000);
      } else {
        setError(data?.error || 'Could not reset the password.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold mb-4">
            <span className="heading-serif text-3xl text-charcoal font-bold">SK</span>
          </div>
          <h1 className="heading-serif text-2xl text-ivory mb-2">Set a new password</h1>
          <p className="text-sm text-ivory/50">Shyamali Krishna Automobile</p>
        </div>

        <div className="bg-ivory p-8">
          {!token ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This link is missing its reset code. Open the link from the email exactly as it was sent, or
                  request a new one from the sign-in screen.
                </span>
              </div>
              <a href="/admin" className="btn-outline w-full">
                Back to sign in
              </a>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 text-success text-sm" role="status">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Your password has been changed and all existing sessions were signed out. Taking you to the
                  sign-in screen…
                </span>
              </div>
              <a href="/admin" className="btn-primary w-full">
                Sign in now
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="reset-new" className="label-field">
                  New password <span className="text-error">*</span>
                </label>
                <input
                  id="reset-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="input-field"
                  autoComplete="new-password"
                  autoFocus
                />
                <p className="text-xs text-stone mt-1.5">
                  At least 8 characters, including a letter and a number.
                </p>
              </div>

              <div>
                <label htmlFor="reset-confirm" className="label-field">
                  Confirm new password <span className="text-error">*</span>
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-field"
                  autoComplete="new-password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-error mt-1">Passwords do not match.</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" /> Set new password
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/admin" className="inline-flex items-center gap-2 text-sm text-ivory/50 hover:text-gold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
