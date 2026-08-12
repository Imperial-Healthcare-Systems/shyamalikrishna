import type { Metadata } from 'next';
import { getCategories, getPartners, getProducts, getServices, getSiteSettings } from '@/lib/data';
import { HomePage } from '@/views/public/HomePage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `Shyamali Krishna Automobile | Premium Agricultural Machinery Dealer, Bihar` },
  description: `Authorized dealer and distributor of premium agricultural machinery across Bihar — Maschio Gaspardo, Sitara AgroTech, Govind, Agrimax, Hazarix. Rotavators, seeders, threshers, harvesters with genuine parts and service.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com' },
};

export default async function Page() {
  const [categories, partners, products, services, settings] = await Promise.all([
    getCategories(),
    getPartners(),
    getProducts(),
    getServices(),
    getSiteSettings(),
  ]);
  return <HomePage initialCategories={categories} initialPartners={partners} initialProducts={products} initialServices={services} initialSettings={settings} />;
}
