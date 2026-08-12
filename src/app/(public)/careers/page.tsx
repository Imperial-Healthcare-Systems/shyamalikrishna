import type { Metadata } from 'next';
import { getJobs } from '@/lib/data';
import { CareersPage } from '@/views/public/CareersPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `Careers — Shyamali Krishna Automobile` },
  description: `Join Shyamali Krishna Automobile — a premium multi-brand agricultural machinery dealer serving Bihar. Explore open positions and submit your application.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/careers' },
};

export default async function Page() {
  const jobs = await getJobs();
  return <CareersPage initialJobs={jobs} />;
}
