'use client';
import type { Partner, Product } from '@/lib/types';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { usePartners, useProducts } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/States';
import { useLang } from '@/lib/i18n';

interface PartnersPageProps {
  initialPartners?: Partner[];
  initialProducts?: Product[];
}

export function PartnersPage({ initialPartners, initialProducts }: PartnersPageProps = {}) {
  const { t } = useLang();
  const { data: partners, loading } = usePartners(initialPartners);
  const { data: products } = useProducts(undefined, initialProducts);

  useSEO({
    title: 'Our OEM Partners — Authorized Agricultural Machinery Brands',
    description: 'Authorized dealer for Maschio Gaspardo, Sitara AgroTech, Gobind Alloys (Govind), Agrimax, Hazarix, and select harvester OEMs. Learn about each partnership.',
    canonical: 'https://www.shyamalikrishna.com/partners',
  });

  if (loading) {
    return (
      <div>
        <PageHero title={t('Our OEM Partners', 'हमारे OEM पार्टनर')} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHero
        eyebrow={t('Partners', 'पार्टनर')}
        title={t('Our OEM Partners', 'हमारे OEM पार्टनर')}
        subtitle={t(
          'A curated portfolio of authorized OEM partnerships — Italian engineering, Indian manufacturing, and specialist implement makers.',
          'अधिकृत OEM साझेदारी का एक चयनित पोर्टफोलियो — इतालवी इंजीनियरिंग, भारतीय निर्माण, और विशेषज्ञ उपकरण निर्माता।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'Partners', href: '/partners' }]} />}
      />

      <section className="section-padding">
        <div className="container-site">
          <div className="space-y-6">
            {(partners || []).map((partner, index) => {
              const partnerProducts = (products || []).filter(p => p.partner_id === partner.id);
              return (
                <Reveal key={partner.id} delay={index * 50}>
                  <Link
                    href={`/partners/${partner.slug}`}
                    className="group block bg-white border border-bone-300 hover:border-gold transition-all p-6 lg:p-8"
                  >
                    <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-charcoal text-gold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <span className="heading-serif text-2xl lg:text-3xl font-bold">
                          {partner.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="heading-serif text-xl lg:text-2xl text-charcoal group-hover:text-gold transition-colors">
                            {partner.name}
                          </h2>
                          {partner.origin_country && (
                            <span className="badge bg-bone text-stone">{partner.origin_country}</span>
                          )}
                        </div>
                        {partner.tagline && (
                          <p className="text-sm text-gold font-medium mb-2">{partner.tagline}</p>
                        )}
                        {partner.positioning && (
                          <p className="text-stone text-sm line-clamp-2 mb-3">{partner.positioning}</p>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gold group-hover:text-gold-600 transition-colors flex items-center gap-1">
                            {t('View partner', 'पार्टनर देखें')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <span className="text-xs text-stone">
                            {partnerProducts.length} {t('products', 'उत्पाद')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
