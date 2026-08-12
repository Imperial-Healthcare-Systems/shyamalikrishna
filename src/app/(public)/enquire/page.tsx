import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { EnquirePage } from '@/views/public/EnquirePage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `Send an Enquiry — Agricultural Machinery RFQ`,
  description: `Send an enquiry about agricultural machinery, spare parts, service, finance, or subsidy assistance. Our team will respond within one business day.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/enquire' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <EnquirePage initialSettings={settings} />;
}
