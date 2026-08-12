import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { TermsOfUsePage } from '@/views/public/TermsOfUsePage';

export const metadata: Metadata = {
  title: `Terms of Use`,
  description: `Terms of use for the Shyamali Krishna Automobile website.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/terms-of-use' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <TermsOfUsePage initialSettings={settings} />;
}
