import { getJob } from '@/lib/data';
import { JobApplyPage } from '@/views/public/JobApplyPage';

export default async function Page({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params;
  const job = jobSlug === 'general-application' ? null : await getJob(jobSlug);
  return <JobApplyPage initialJob={job} />;
}
