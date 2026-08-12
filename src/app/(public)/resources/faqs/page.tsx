import type { Metadata } from 'next';
import { getFaqs } from '@/lib/data';
import { FaqsPage } from '@/views/public/FaqsPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `FAQs — Frequently Asked Questions`,
  description: `Answers to common questions about our agricultural machinery, services, financing, subsidy assistance, and after-sales support in Bihar.`,
  alternates: { canonical: 'https://www.shyamalikrishna.com/resources/faqs' },
};

export default async function Page() {
  const faqs = await getFaqs();
  return <FaqsPage initialFaqs={faqs} />;
}
