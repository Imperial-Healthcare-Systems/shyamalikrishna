'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/views/admin/ProtectedRoute';
import { AdminLayout as AdminShell } from '@/views/admin/AdminLayout';

export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The login screen lives at /admin itself and must render without the shell.
  if (pathname === '/admin') return <>{children}</>;

  return (
    <ProtectedRoute>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
