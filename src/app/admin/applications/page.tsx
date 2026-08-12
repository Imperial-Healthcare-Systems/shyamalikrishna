import { Suspense } from "react";
import { AdminApplications } from '@/views/admin/AdminApplications';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminApplications />
    </Suspense>
  );
}
