import { AdminProductEditor } from '@/views/admin/AdminProductEditor';

// The admin portal must never be indexed. robots.txt blocks /admin as well;
// this is the per-page belt to that braces.
export const metadata = { title: "Edit Product", robots: { index: false, follow: false } };

export default function Page() {
  return <AdminProductEditor />;
}
