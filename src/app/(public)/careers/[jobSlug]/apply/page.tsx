import { getJob } from '@/lib/data';
import { JobApplyPage } from '@/views/public/JobApplyPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export default async function Page({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params;
  const job = jobSlug === 'general-application' ? null : await getJob(jobSlug);
  return <JobApplyPage initialJob={job} />;
}
