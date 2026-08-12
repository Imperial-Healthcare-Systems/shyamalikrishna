import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getJob } from '@/lib/data';
import { JobDetailPage } from '@/views/public/JobDetailPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ jobSlug: string }> }): Promise<Metadata> {
  const { jobSlug } = await params;
  const job = await getJob(jobSlug);
  if (!job) return { title: 'Not Found' };
  return {
    title: job.title,
    description: job.summary || undefined,
    alternates: { canonical: `https://www.shyamalikrishna.com` + `/careers/${jobSlug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params;
  const job = await getJob(jobSlug);
  if (!job) notFound();
  return <JobDetailPage initialJob={job} />;
}
