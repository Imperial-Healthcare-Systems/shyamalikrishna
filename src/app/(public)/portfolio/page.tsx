import type { Metadata } from 'next';
import { getCategories, getPartners, getProducts } from '@/lib/data';
import { PortfolioPage } from '@/views/public/PortfolioPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `Product Portfolio — Agricultural Machinery`,
  description: `Browse our full portfolio of agricultural machinery — rotavators, seeders, Happy Seeders, straw reapers, threshers, cultivators, harvesters, and specialist implements from Maschio Gaspardo, Sitara AgroTech, Govind, Agrimax, and Hazarix.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/portfolio' },
};

export default async function Page() {
  const [categories, partners, products] = await Promise.all([
    getCategories(),
    getPartners(),
    getProducts(),
  ]);
  return <PortfolioPage initialCategories={categories} initialPartners={partners} initialProducts={products} />;
}
