import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { EnquirePage } from '@/views/public/EnquirePage';

export const metadata: Metadata = {
  title: `Send an Enquiry — Agricultural Machinery RFQ`,
  description: `Send an enquiry about agricultural machinery, spare parts, service, finance, or subsidy assistance. Our team will respond within one business day.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/enquire' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <EnquirePage initialSettings={settings} />;
}
