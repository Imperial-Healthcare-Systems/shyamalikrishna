'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '@/lib/auth';
import { useSEO } from '@/lib/seo';

export function AdminLogin() {
  const { login, isAuthenticated, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useSEO({
    title: 'Admin Login',
    description: 'Administrator login for Shyamali Krishna Automobile.',
    canonical: 'https://www.shyamalikrishna.com/admin',
    hreflang: false,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (isAuthenticated) {
    router.push('/admin/dashboard');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(password);
    if (result.success) {
      router.push('/admin/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="label-field">
                Administrator Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
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
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
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
