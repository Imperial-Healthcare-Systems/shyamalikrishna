'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Landmark, HelpCircle } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Reveal } from '@/components/ui/Reveal';
import { useLang } from '@/lib/i18n';

export function ResourcesPage() {
  const { t } = useLang();

  useSEO({
    title: 'Resources — Machinery Guides, Subsidy Schemes, FAQs',
    description: 'Resources for farmers: machinery selection guides, applicable government subsidy schemes, and frequently asked questions about agricultural machinery in Bihar.',
    canonical: 'https://www.shyamalikrishna.com/resources',
  });

  const resourceTypes = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: t('Machinery Selection Guides', 'मशीनरी चयन गाइड'),
      desc: t(
        'Practical guidance on selecting the right implement for your soil, crop, and tractor.',
        'अपनी मिट्टी, फसल, और ट्रैक्टर के लिए सही उपकरण चुनने पर व्यावहारिक मार्गदर्शन।'
      ),
      href: '/resources/machinery-guides',
    },
    {
      icon: <Landmark className="w-6 h-6" />,
      title: t('Applicable Subsidy Schemes', 'लागू सब्सिडी योजनाएं'),
      desc: t(
        'Information about government subsidy schemes applicable to agricultural machinery.',
        'कृषि मशीनरी पर लागू सरकारी सब्सिडी योजनाओं की जानकारी।'
      ),
      href: '/resources/subsidy-schemes',
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      title: t('Frequently Asked Questions', 'अक्सर पूछे जाने वाले प्रश्न'),
      desc: t(
        'Answers to common questions about our products, services, and processes.',
        'हमारे उत्पादों, सेवाओं, और प्रक्रियाओं के बारे में सामान्य प्रश्नों के उत्तर।'
      ),
      href: '/resources/faqs',
    },
  ];

  return (
    <div>
      <PageHero
        eyebrow={t('Resources', 'संसाधन')}
        title={t('Resources', 'संसाधन')}
        subtitle={t(
          'Guides, subsidy information, and answers to help you make informed decisions about agricultural machinery.',
          'कृषि मशीनरी के बारे में जानकारीपूर्ण निर्णय लेने में मदद के लिए गाइड, सब्सिडी जानकारी, और उत्तर।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'Resources', href: '/resources' }]} />}
      />

      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resourceTypes.map((resource, index) => (
              <Reveal key={index} delay={index * 50}>
                <Link
                  href={resource.href}
                  className="group flex flex-col bg-white border border-bone-300 hover:border-gold transition-all p-8 min-h-[240px]"
                >
                  <div className="w-12 h-12 bg-charcoal text-gold flex items-center justify-center mb-4 group-hover:bg-gold group-hover:text-charcoal transition-colors">
                    {resource.icon}
                  </div>
                  <h2 className="heading-serif text-xl text-charcoal group-hover:text-gold transition-colors mb-3">
                    {resource.title}
                  </h2>
                  <p className="text-sm text-stone flex-1">{resource.desc}</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-gold mt-4">
                    {t('Explore', 'देखें')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
