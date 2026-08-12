import type { Metadata } from 'next';
import { getJobs } from '@/lib/data';
import { CareersPage } from '@/views/public/CareersPage';

export const metadata: Metadata = {
  title: { absolute: `Careers — Shyamali Krishna Automobile` },
  description: `Join Shyamali Krishna Automobile — a premium multi-brand agricultural machinery dealer serving Bihar. Explore open positions and submit your application.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/careers' },
};

export default async function Page() {
  const jobs = await getJobs();
  return <CareersPage initialJobs={jobs} />;
}
