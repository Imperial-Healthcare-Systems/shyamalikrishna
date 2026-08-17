import { AdminJobCategories } from '@/views/admin/AdminJobCategories';

export const metadata = { title: 'Job Categories', robots: { index: false, follow: false } };

export default function Page() {
  return <AdminJobCategories />;
}
