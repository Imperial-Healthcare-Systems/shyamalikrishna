import type { Metadata } from 'next';
import { getJobs, getJobCategories, getJobLocations } from '@/lib/data';
import { CareersPage } from '@/views/public/CareersPage';

// Re-render at most every 5 minutes so a vacancy published from the admin
// portal reaches the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `Careers — Shyamali Krishna Automobile` },
  description:
    `Explore current openings at Shyamali Krishna Automobile Private Limited — an authorized multi-brand ` +
    `agricultural machinery dealer serving Nawada and adjoining districts of Bihar. Apply online with your CV.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/careers' },
};

export default async function Page() {
  const [jobs, categories, locations] = await Promise.all([
    getJobs(),
    getJobCategories(),
    getJobLocations(),
  ]);

  return <CareersPage initialJobs={jobs} initialCategories={categories} initialLocations={locations} />;
}
