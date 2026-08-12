import type { Metadata } from 'next';
import { getFaqs } from '@/lib/data';
import { FaqsPage } from '@/views/public/FaqsPage';

export const metadata: Metadata = {
  title: `FAQs — Frequently Asked Questions`,
  description: `Answers to common questions about our agricultural machinery, services, financing, subsidy assistance, and after-sales support in Bihar.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/resources/faqs' },
};

export default async function Page() {
  const faqs = await getFaqs();
  return <FaqsPage initialFaqs={faqs} />;
}
