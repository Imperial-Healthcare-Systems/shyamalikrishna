'use client';
import type { Faq, Resource } from '@/lib/types';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useSEO } from '@/lib/seo';
import { useResources, useFaqs } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { Reveal } from '@/components/ui/Reveal';
import { useLang } from '@/lib/i18n';
import { useState } from 'react';
import { Search } from 'lucide-react';

interface ResourceDetailPageProps {
  initialFaqs?: Faq[];
  initialResources?: Resource[];
  resourceType?: 'guide' | 'subsidy';
}

export function ResourceDetailPage({ resourceType, initialFaqs, initialResources}: ResourceDetailPageProps) {
  const { resourceSlug } = useParams<{ resourceSlug: string }>();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { t } = useLang();
  const [search, setSearch] = useState(searchQuery);

  // Determine what to load
  const type = resourceType || (resourceSlug ? undefined : undefined);
  const { data: resources, loading } = useResources(type, initialResources);
  const { data: faqs } = useFaqs(initialFaqs);

  // If specific slug, find that resource
  const specificResource = resourceSlug
    ? (resources || []).find(r => r.slug === resourceSlug)
    : null;

  useSEO({
    title: specificResource
      ? specificResource.title
      : resourceType === 'guide'
      ? 'Machinery Selection Guides'
      : resourceType === 'subsidy'
      ? 'Applicable Subsidy Schemes'
      : 'Resources',
    description: specificResource?.excerpt || 'Agricultural machinery resources and guides.',
    canonical: specificResource
      ? `https://www.shyamalikrishna.com/resources/${specificResource.slug}`
      : resourceType === 'guide'
      ? 'https://www.shyamalikrishna.com/resources/machinery-guides'
      : 'https://www.shyamalikrishna.com/resources/subsidy-schemes',
  });

  if (loading) {
    return (
      <div>
        <PageHero title={t('Resources', 'संसाधन')} />
        <LoadingSpinner />
      </div>
    );
  }

  // Show specific resource
  if (specificResource) {
    return (
      <div>
        <PageHero
          title={specificResource.title}
          subtitle={specificResource.excerpt || undefined}
          breadcrumb={
            <Breadcrumbs items={[
              { label: 'Resources', href: '/resources' },
              { label: specificResource.title },
            ]} />
          }
        />
        <section className="section-padding">
          <div className="container-site">
            <div className="max-w-3xl">
              {specificResource.content ? (
                <div className="prose prose-stone max-w-none">
                  <p className="text-stone leading-relaxed whitespace-pre-line">{specificResource.content}</p>
                </div>
              ) : (
                <EmptyState
                  title={t('Content coming soon', 'सामग्री जल्द आ रही है')}
                  message={t('This resource is being prepared. Please check back soon.', 'यह संसाधन तैयार किया जा रहा है। कृपया जल्द ही वापस जांचें।')}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show FAQ page
  if (!resourceType && !resourceSlug) {
    return null; // handled by FaqsPage route
  }

  // Show guide or subsidy list
  const title = resourceType === 'guide'
    ? t('Machinery Selection Guides', 'मशीनरी चयन गाइड')
    : t('Applicable Subsidy Schemes', 'लागू सब्सिडी योजनाएं');

  const desc = resourceType === 'guide'
    ? t('Practical guidance on selecting the right implement for your farm.', 'अपने खेत के लिए सही उपकरण चुनने पर व्यावहारिक मार्गदर्शन।')
    : t('Information about government subsidy schemes for agricultural machinery.', 'कृषि मशीनरी के लिए सरकारी सब्सिडी योजनाओं की जानकारी।');

  const filtered = search
    ? (resources || []).filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.excerpt || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.content || '').toLowerCase().includes(search.toLowerCase())
      )
    : (resources || []);

  return (
    <div>
      <PageHero
        eyebrow={t('Resources', 'संसाधन')}
        title={title}
        subtitle={desc}
        breadcrumb={
          <Breadcrumbs items={[
            { label: 'Resources', href: '/resources' },
            { label: title },
          ]} />
        }
      />

      <section className="section-padding">
        <div className="container-site">
          {/* Search */}
          <div className="max-w-xl mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('Search resources…', 'संसाधन खोजें…')}
                className="input-field pl-10"
                aria-label="Search resources"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={t('No resources found', 'कोई संसाधन नहीं मिला')}
              message={search
                ? t('No resources matched your search.', 'आपकी खोज से कोई संसाधन मेल नहीं खाया।')
                : t('Resources will be added here soon. Please check back.', 'संसाधन जल्द यहां जोड़े जाएंगे। कृपया जांचते रहें।')
              }
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((resource, index) => (
                <Reveal key={resource.id} delay={index * 50}>
                  <Link
                    href={`/resources/${resource.slug}`}
                    className="group block bg-white border border-bone-300 hover:border-gold transition-all p-6"
                  >
                    <h2 className="heading-serif text-lg text-charcoal group-hover:text-gold transition-colors mb-2">
                      {resource.title}
                    </h2>
                    {resource.excerpt && (
                      <p className="text-sm text-stone line-clamp-2">{resource.excerpt}</p>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          {/* FAQ section for guides page */}
          {resourceType === 'guide' && (faqs || []).length > 0 && (
            <div className="mt-16">
              <h2 className="heading-serif text-2xl text-charcoal mb-6">
                {t('Frequently Asked Questions', 'अक्सर पूछे जाने वाले प्रश्न')}
              </h2>
              <div className="space-y-3">
                {(faqs || []).map((faq, index) => (
                  <Reveal key={faq.id} delay={index * 30}>
                    <details className="group bg-white border border-bone-300">
                      <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-charcoal list-none min-h-[44px]">
                        {faq.question}
                        <span className="text-gold text-xl group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <div className="px-4 pb-4 text-stone text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
