import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getJob } from '@/lib/data';
import { JobApplyPage } from '@/views/public/JobApplyPage';

export const revalidate = 300;

// An application form has nothing to offer a search engine, and indexing it
// competes with the job page it belongs to.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function Page({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params;

  if (jobSlug === 'general-application') {
    return <JobApplyPage initialJob={null} />;
  }

  const job = await getJob(jobSlug);
  if (!job) notFound();

  return <JobApplyPage initialJob={job} />;
}
