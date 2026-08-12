import type { Metadata } from 'next';
import { getServices } from '@/lib/data';
import { ServicesPage } from '@/views/public/ServicesPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `Services — Sales, Service, Parts, Finance, Subsidy`,
  description: `Sales consultation, after-sales service, genuine spare parts, finance and EMI assistance, and government subsidy coordination for agricultural machinery in Bihar.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/services' },
};

export default async function Page() {
  const services = await getServices();
  return <ServicesPage initialServices={services} />;
}
