import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getService, getSiteSettings } from '@/lib/data';
import { ServiceDetailPage } from '@/views/public/ServiceDetailPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ serviceSlug: string }> }): Promise<Metadata> {
  const { serviceSlug } = await params;
  const service = await getService(serviceSlug);
  if (!service) return { title: 'Not Found' };
  return {
    title: service.name,
    description: service.short_description || service.overview || undefined,
    alternates: { canonical: `https://www.shyamalikrishna.com` + `/services/${serviceSlug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ serviceSlug: string }> }) {
  const { serviceSlug } = await params;
  const service = await getService(serviceSlug);
  if (!service) notFound();
  const settings = await getSiteSettings();
  return <ServiceDetailPage initialService={service} initialSettings={settings} />;
}
