'use client';
import type { Service } from '@/lib/types';

import Link from 'next/link';
import { ArrowRight, Handshake, Wrench, Package, Banknote, Landmark } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useServices } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/States';
import { useLang } from '@/lib/i18n';

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'sales-consultation': <Handshake className="w-6 h-6" />,
  'after-sales-service': <Wrench className="w-6 h-6" />,
  'spare-parts': <Package className="w-6 h-6" />,
  'finance-emi': <Banknote className="w-6 h-6" />,
  'subsidy-assistance': <Landmark className="w-6 h-6" />,
};

interface ServicesPageProps {
  initialServices?: Service[];
}

export function ServicesPage({ initialServices }: ServicesPageProps = {}) {
  const { t } = useLang();
  const { data: services, loading } = useServices(initialServices);

  useSEO({
    title: 'Services — Sales, Service, Parts, Finance, Subsidy',
    description: 'Sales consultation, after-sales service, genuine spare parts, finance and EMI assistance, and government subsidy coordination for agricultural machinery in Bihar.',
    canonical: 'https://www.shyamalikrishna.com/services',
  });

  if (loading) {
    return (
      <div>
        <PageHero title={t('Services', 'सेवाएं')} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHero
        eyebrow={t('Services', 'सेवाएं')}
        title={t('Services', 'सेवाएं')}
        subtitle={t(
          'We support the full lifecycle of your machinery — from selection and sales to service, parts, financing, and subsidy coordination.',
          'हम आपकी मशीनरी के पूर्ण जीवनचक्र का समर्थन करते हैं — चयन और बिक्री से सेवा, पार्ट्स, वित्त, और सब्सिडी समन्वय तक।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'Services', href: '/services' }]} />}
      />

      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(services || []).map((service, index) => (
              <Reveal key={service.id} delay={index * 50}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex flex-col bg-white border border-bone-300 hover:border-gold transition-all p-6 min-h-[220px]"
                >
                  <div className="w-12 h-12 bg-charcoal text-gold flex items-center justify-center mb-4 group-hover:bg-gold group-hover:text-charcoal transition-colors">
                    {SERVICE_ICONS[service.slug] || <Wrench className="w-6 h-6" />}
                  </div>
                  <h2 className="heading-serif text-lg text-charcoal group-hover:text-gold transition-colors mb-2">
                    {t(service.name, service.name_hi || service.name)}
                  </h2>
                  {service.short_description && (
                    <p className="text-sm text-stone line-clamp-3 flex-1">
                      {t(service.short_description, service.short_description_hi || service.short_description)}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm font-medium text-gold mt-4">
                    {t('Learn more', 'और जानें')}
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
