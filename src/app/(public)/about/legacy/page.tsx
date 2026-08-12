import type { Metadata } from 'next';
import { LegacyPage } from '@/views/public/LegacyPage';

export const metadata: Metadata = {
  title: { absolute: `Legacy & Milestones — Shyamali Krishna Automobile` },
  description: `The milestones and journey of Shyamali Krishna Automobile Private Limited.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/about/legacy' },
};

export default async function Page() {
  return <LegacyPage />;
}
