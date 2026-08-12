import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { TermsOfUsePage } from '@/views/public/TermsOfUsePage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `Terms of Use`,
  description: `Terms of use for the Shyamali Krishna Automobile website.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/terms-of-use' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <TermsOfUsePage initialSettings={settings} />;
}
