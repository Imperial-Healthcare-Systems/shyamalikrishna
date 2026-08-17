import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminResetPassword } from '@/views/admin/AdminResetPassword';

export const metadata = { title: 'Reset Admin Password', robots: { index: false, follow: false } };

// The reset token arrives as a query parameter, so this page cannot be
// prerendered — reading it during static generation would throw.
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-charcoal">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      }
    >
      <AdminResetPassword />
    </Suspense>
  );
}
