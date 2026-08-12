import type { Metadata } from 'next';
import { getPartners, getProducts } from '@/lib/data';
import { PartnersPage } from '@/views/public/PartnersPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `Our OEM Partners — Authorized Agricultural Machinery Brands`,
  description: `Authorized dealer for Maschio Gaspardo, Sitara AgroTech, Gobind Alloys (Govind), Agrimax, Hazarix, and select harvester OEMs. Learn about each partnership.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/partners' },
};

export default async function Page() {
  const [partners, products] = await Promise.all([
    getPartners(),
    getProducts(),
  ]);
  return <PartnersPage initialPartners={partners} initialProducts={products} />;
}
