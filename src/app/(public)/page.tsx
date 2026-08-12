import type { Metadata } from 'next';
import { getCategories, getPartners, getProducts, getServices, getSiteSettings } from '@/lib/data';
import { HomePage } from '@/views/public/HomePage';

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
