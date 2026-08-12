'use client';
import type { Faq } from '@/lib/types';

import { useSEO } from '@/lib/seo';
import { useFaqs } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { Reveal } from '@/components/ui/Reveal';
import { useLang } from '@/lib/i18n';
import { useState } from 'react';

interface FaqsPageProps {
  initialFaqs?: Faq[];
}

export function FaqsPage({ initialFaqs }: FaqsPageProps = {}) {
  const { t } = useLang();
  const { data: faqs, loading } = useFaqs(initialFaqs);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useSEO({
    title: 'FAQs — Frequently Asked Questions',
    description: 'Answers to common questions about our agricultural machinery, services, financing, subsidy assistance, and after-sales support in Bihar.',
    canonical: 'https://www.shyamalikrishna.com/resources/faqs',
    structuredData: (faqs || []).length > 0 ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: (faqs || []).map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    } : undefined,
  });

  if (loading) {
    return (
      <div>
        <PageHero title={t('FAQs', 'अक्सर पूछे जाने वाले प्रश्न')} />
        <LoadingSpinner />
      </div>
    );
  }

  const categories = Array.from(new Set((faqs || []).map(f => f.category).filter(Boolean))) as string[];
  const filtered = activeCategory === 'all'
    ? (faqs || [])
    : (faqs || []).filter(f => f.category === activeCategory);

  return (
    <div>
      <PageHero
        eyebrow={t('Resources', 'संसाधन')}
        title={t('Frequently Asked Questions', 'अक्सर पूछे जाने वाले प्रश्न')}
        subtitle={t(
          'Answers to common questions about our products, services, and processes.',
          'हमारे उत्पादों, सेवाओं, और प्रक्रियाओं के बारे में सामान्य प्रश्नों के उत्तर।'
        )}
        breadcrumb={
          <Breadcrumbs items={[
            { label: 'Resources', href: '/resources' },
            { label: 'FAQs' },
          ]} />
        }
      />

      <section className="section-padding">
        <div className="container-site">
          <div className="max-w-3xl mx-auto">
            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`badge transition-colors min-h-[36px] ${
                    activeCategory === 'all'
                      ? 'bg-charcoal text-ivory'
                      : 'bg-bone text-charcoal hover:bg-bone-300'
                  }`}
                >
                  {t('All', 'सभी')}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`badge transition-colors min-h-[36px] ${
                      activeCategory === cat
                        ? 'bg-charcoal text-ivory'
                        : 'bg-bone text-charcoal hover:bg-bone-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <EmptyState
                title={t('No FAQs available', 'कोई FAQ उपलब्ध नहीं')}
                message={t('Frequently asked questions will appear here soon.', 'अक्सर पूछे जाने वाले प्रश्न जल्द यहां दिखाई देंगे।')}
              />
            ) : (
              <div className="space-y-3">
                {filtered.map((faq, index) => (
                  <Reveal key={faq.id} delay={index * 30}>
                    <details className="group bg-white border border-bone-300">
                      <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-charcoal list-none min-h-[44px]">
                        {faq.question}
                        <span className="text-gold text-xl group-open:rotate-45 transition-transform shrink-0 ml-4">+</span>
                      </summary>
                      <div className="px-4 pb-4 text-stone text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
