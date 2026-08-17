import { Suspense } from "react";
import { AdminApplications } from '@/views/admin/AdminApplications';

// The admin portal must never be indexed. robots.txt blocks /admin as well;
// this is the per-page belt to that braces.
export const metadata = { title: "Applications", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminApplications />
    </Suspense>
  );
}
