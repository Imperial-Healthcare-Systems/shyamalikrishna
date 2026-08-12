import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPartner, getPartnerProducts, getSiteSettings } from '@/lib/data';
import { PartnerDetailPage } from '@/views/public/PartnerDetailPage';

export async function generateMetadata({ params }: { params: Promise<{ partnerSlug: string }> }): Promise<Metadata> {
  const { partnerSlug } = await params;
  const partner = await getPartner(partnerSlug);
  if (!partner) return { title: 'Not Found' };
  return {
    title: partner.name,
    description: partner.tagline || partner.positioning || undefined,
    alternates: { canonical: `https://www.shyamalikrishna.com` + `/partners/${partnerSlug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ partnerSlug: string }> }) {
  const { partnerSlug } = await params;
  const partner = await getPartner(partnerSlug);
  if (!partner) notFound();
  const [products, settings] = await Promise.all([
    getPartnerProducts(partner.id),
    getSiteSettings(),
  ]);
  return <PartnerDetailPage initialPartner={partner} initialProducts={products} initialSettings={settings} />;
}
