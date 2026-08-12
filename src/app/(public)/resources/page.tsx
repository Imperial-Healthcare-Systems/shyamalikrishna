import type { Metadata } from 'next';
import { ResourcesPage } from '@/views/public/ResourcesPage';

export const metadata: Metadata = {
  title: `Resources — Machinery Guides, Subsidy Schemes, FAQs`,
  description: `Resources for farmers: machinery selection guides, applicable government subsidy schemes, and frequently asked questions about agricultural machinery in Bihar.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/resources' },
};

export default async function Page() {
  return <ResourcesPage />;
}
