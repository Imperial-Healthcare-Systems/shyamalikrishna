'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { AdminAuthProvider } from '@/lib/auth';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AdminAuthProvider>{children}</AdminAuthProvider>
    </LanguageProvider>
  );
}
