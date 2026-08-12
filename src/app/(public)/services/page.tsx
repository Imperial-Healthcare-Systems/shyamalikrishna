import type { Metadata } from 'next';
import { getServices } from '@/lib/data';
import { ServicesPage } from '@/views/public/ServicesPage';

export const metadata: Metadata = {
  title: `Services — Sales, Service, Parts, Finance, Subsidy`,
  description: `Sales consultation, after-sales service, genuine spare parts, finance and EMI assistance, and government subsidy coordination for agricultural machinery in Bihar.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/services' },
};

export default async function Page() {
  const services = await getServices();
  return <ServicesPage initialServices={services} />;
}
