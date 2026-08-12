import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { RefundCancellationPage } from '@/views/public/RefundCancellationPage';

export const metadata: Metadata = {
  title: `Refund & Cancellation Policy`,
  description: `Refund and cancellation policy for Shyamali Krishna Automobile Private Limited.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/refund-cancellation' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <RefundCancellationPage initialSettings={settings} />;
}
