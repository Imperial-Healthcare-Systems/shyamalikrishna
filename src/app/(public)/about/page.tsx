import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { AboutPage } from '@/views/public/AboutPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `About Us — Shyamali Krishna Automobile` },
  description: `Shyamali Krishna Automobile Private Limited is an authorized multi-brand agricultural machinery dealer serving Nawada, Bihar and adjoining regions. Learn about our advisory approach, OEM partnerships, and after-sales commitment.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/about' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <AboutPage initialSettings={settings} />;
}
