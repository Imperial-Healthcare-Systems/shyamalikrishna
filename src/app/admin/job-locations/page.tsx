import { AdminJobLocations } from '@/views/admin/AdminJobLocations';

export const metadata = { title: 'Locations', robots: { index: false, follow: false } };

export default function Page() {
  return <AdminJobLocations />;
}
