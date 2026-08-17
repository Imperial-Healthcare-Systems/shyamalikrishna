import { Suspense } from "react";
import { AdminLeads } from '@/views/admin/AdminLeads';

// The admin portal must never be indexed. robots.txt blocks /admin as well;
// this is the per-page belt to that braces.
export const metadata = { title: "Leads", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLeads />
    </Suspense>
  );
}
