import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { RefundCancellationPage } from '@/views/public/RefundCancellationPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `Refund & Cancellation Policy`,
  description: `Refund and cancellation policy for Shyamali Krishna Automobile Private Limited.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/refund-cancellation' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <RefundCancellationPage initialSettings={settings} />;
}
