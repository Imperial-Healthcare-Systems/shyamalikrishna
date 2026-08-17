import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getJob } from '@/lib/data';
import { JobDetailPage } from '@/views/public/JobDetailPage';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ jobSlug: string }> }): Promise<Metadata> {
  const { jobSlug } = await params;
  const job = await getJob(jobSlug);
  if (!job) return { title: 'Position Not Found', robots: { index: false, follow: true } };

  const title = job.seo_title || `${job.title} Jobs | Shyamali Krishna Automobile`;
  const description =
    job.seo_description ||
    job.summary ||
    `Apply for the ${job.title} vacancy at Shyamali Krishna Automobile Private Limited, Nawada, Bihar.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `https://www.shyamalikrishna.com/careers/${jobSlug}` },
    // A closed vacancy still renders for anyone holding the link, but there is
    // no reason for a search engine to keep offering it to new candidates.
    robots: job.status === 'published' ? undefined : { index: false, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params;

  // getJob returns published and closed jobs only — a draft is not public, so
  // guessing its URL gets the same 404 as a slug that never existed.
  const job = await getJob(jobSlug);
  if (!job) notFound();

  return <JobDetailPage initialJob={job} />;
}
