import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { PrivacyPolicyPage } from '@/views/public/PrivacyPolicyPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `Privacy Policy`,
  description: `Privacy policy for Shyamali Krishna Automobile Private Limited — how we collect, use, and protect your personal information.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/privacy-policy' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <PrivacyPolicyPage initialSettings={settings} />;
}
