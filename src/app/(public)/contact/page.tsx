import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data';
import { ContactPage } from '@/views/public/ContactPage';

export const metadata: Metadata = {
  title: { absolute: `Contact Us — Shyamali Krishna Automobile` },
  description: `Contact Shyamali Krishna Automobile in Nawada, Bihar. Phone: +91 7488095803. Email: info@shyamalikrishna.com. Authorized agricultural machinery dealer for Bihar.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/contact' },
};

export default async function Page() {
  const settings = await getSiteSettings();
  return <ContactPage initialSettings={settings} />;
}
