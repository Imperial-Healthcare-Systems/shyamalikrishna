'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { useAdminAuth } from '@/lib/auth';
import { useSEO } from '@/lib/seo';

export function AdminLogin() {
  const { login, isAuthenticated, loading: authLoading } = useAdminAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySent, setRecoverySent] = useState<string | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);

  useSEO({
    title: 'Admin Login',
    description: 'Administrator login for Shyamali Krishna Automobile.',
    canonical: 'https://www.shyamalikrishna.com/admin',
    hreflang: false,
  });

  // Redirect as an effect rather than during render — calling router.push()
  // inside the render body warns in React 19 and can loop.
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace('/admin/dashboard');
  }, [authLoading, isAuthenticated, router]);

  // Only offer recovery if the server can actually send an email.
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/admin/password/recovery-status');
        const data = await response.json().catch(() => ({}));
        setEmailConfigured(Boolean(data?.email_configured));
      } catch {
        setEmailConfigured(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    const result = await login(password);
    if (result.success) {
      router.replace(result.mustChangePassword ? '/admin/settings' : '/admin/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  const requestReset = async () => {
    setRecoveryBusy(true);
    setRecoveryError('');
    setRecoverySent(null);
    try {
      const response = await fetch('/api/admin/password/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.success) {
        setRecoverySent(data.sent_to || 'the address on file');
      } else {
        setRecoveryError(data?.error || 'Could not start a password reset.');
      }
    } catch {
      setRecoveryError('Could not reach the server. Please try again.');
    }
    setRecoveryBusy(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold mb-4">
            <span className="heading-serif text-3xl text-charcoal font-bold">SK</span>
          </div>
          <h1 className="heading-serif text-2xl text-ivory mb-2">Admin Portal</h1>
          <p className="text-sm text-ivory/50">Shyamali Krishna Automobile</p>
        </div>

        <div className="bg-ivory p-8">
          {recoveryOpen ? (
            // ---- Password recovery ------------------------------------------
            <div>
              <h2 className="heading-serif text-lg text-charcoal mb-2">Reset your password</h2>

              {recoverySent ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 text-success text-sm" role="status">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      A reset link has been sent to <strong>{recoverySent}</strong>. It works once and expires in
                      30 minutes. Check that inbox to continue.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryOpen(false);
                      setRecoverySent(null);
                    }}
                    className="btn-outline w-full"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-stone leading-relaxed">
                    For security, the reset link is only ever sent to the company address already on file — it
                    cannot be redirected to another mailbox. Open that inbox to complete the reset.
                  </p>

                  {emailConfigured === false && (
                    <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 text-warning text-sm" role="alert">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Email is not configured on this site, so a reset link cannot be sent. Contact your
                        developer to set the mail credentials, or sign in and change the password from Settings.
                      </span>
                    </div>
                  )}

                  {recoveryError && (
                    <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm" role="alert">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={requestReset}
                    disabled={recoveryBusy || emailConfigured === false}
                    className="btn-primary w-full"
                  >
                    {recoveryBusy ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" /> Send reset link
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryOpen(false);
                      setRecoveryError('');
                    }}
                    className="btn-ghost w-full"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ---- Sign in ----------------------------------------------------
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="label-field">
                  Administrator Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" aria-hidden="true" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field pl-10"
                    placeholder="Enter password"
                    autoFocus
                    autoComplete="current-password"
                  />
                </div>
                <p className="text-xs text-stone mt-1.5">No username needed — the password alone signs you in.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  'Login'
                )}
              </button>

              {emailConfigured && (
                <button
                  type="button"
                  onClick={() => setRecoveryOpen(true)}
                  className="w-full text-center text-sm text-stone hover:text-gold transition-colors min-h-[44px]"
                >
                  Forgot your password?
                </button>
              )}
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-ivory/50 hover:text-gold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
