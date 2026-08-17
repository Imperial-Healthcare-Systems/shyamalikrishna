import { AdminResources } from '@/views/admin/AdminResources';

// The admin portal must never be indexed. robots.txt blocks /admin as well;
// this is the per-page belt to that braces.
export const metadata = { title: "Resources", robots: { index: false, follow: false } };

export default function Page() {
  return <AdminResources tab="resources" />;
}
