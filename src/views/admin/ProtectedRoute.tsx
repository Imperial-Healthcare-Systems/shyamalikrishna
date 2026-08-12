'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const router = useRouter();

  // The token lives in localStorage, so the check can only run after mount —
  // redirect as an effect rather than rendering a <Navigate> during render.
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/admin');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return <>{children}</>;
}
