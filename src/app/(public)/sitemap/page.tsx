import type { Metadata } from 'next';
import { getCategories, getJobs, getPartners, getProducts, getResources, getServices } from '@/lib/data';
import { SitemapPage } from '@/views/public/SitemapPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `Sitemap`,
  description: `Complete sitemap of the Shyamali Krishna Automobile website.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/sitemap' },
};

export default async function Page() {
  const [categories, partners, products, services, jobs, resources] = await Promise.all([
    getCategories(),
    getPartners(),
    getProducts(),
    getServices(),
    getJobs(),
    getResources(),
  ]);
  return <SitemapPage initialCategories={categories} initialPartners={partners} initialProducts={products} initialServices={services} initialJobs={jobs} initialResources={resources} />;
}
