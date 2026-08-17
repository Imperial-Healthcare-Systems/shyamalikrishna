'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/views/admin/ProtectedRoute';
import { AdminLayout as AdminShell } from '@/views/admin/AdminLayout';

/**
 * Routes that must render without the shell *and* without an auth check.
 *
 * /admin is the login screen. /admin/reset-password is reached from an emailed
 * link by someone who by definition cannot sign in — putting it behind
 * ProtectedRoute would bounce them straight back to the login they are locked
 * out of. Its own single-use token is what authorises it.
 */
const UNPROTECTED = new Set(['/admin', '/admin/reset-password']);

export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (UNPROTECTED.has(pathname)) return <>{children}</>;

  return (
    <ProtectedRoute>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
