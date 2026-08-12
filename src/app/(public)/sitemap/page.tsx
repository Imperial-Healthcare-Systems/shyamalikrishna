import type { Metadata } from 'next';
import { getCategories, getJobs, getPartners, getProducts, getResources, getServices } from '@/lib/data';
import { SitemapPage } from '@/views/public/SitemapPage';

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
