import type { Metadata } from 'next';
import { LeadershipPage } from '@/views/public/LeadershipPage';

export const metadata: Metadata = {
  title: { absolute: `Leadership — Shyamali Krishna Automobile` },
  description: `The leadership team at Shyamali Krishna Automobile Private Limited.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/about/leadership' },
};

export default async function Page() {
  return <LeadershipPage />;
}
