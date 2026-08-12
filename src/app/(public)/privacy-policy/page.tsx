import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { PrivacyPolicyPage } from '@/views/public/PrivacyPolicyPage';

export const metadata: Metadata = {
  title: `Privacy Policy`,
  description: `Privacy policy for Shyamali Krishna Automobile Private Limited — how we collect, use, and protect your personal information.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/privacy-policy' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <PrivacyPolicyPage initialSettings={settings} />;
}
