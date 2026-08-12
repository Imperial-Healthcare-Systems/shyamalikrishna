import { Suspense } from "react";
import { AdminLeads } from '@/views/admin/AdminLeads';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLeads />
    </Suspense>
  );
}
