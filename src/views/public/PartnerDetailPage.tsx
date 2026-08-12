'use client';
import type { Partner, Product, SiteSettings } from '@/lib/types';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Phone, MessageCircle } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { usePartner, usePartnerProducts, useSiteSettings } from '@/lib/hooks';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductCard } from '@/components/products/ProductCard';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { Reveal } from '@/components/ui/Reveal';
import { telLink, whatsappLink } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface PartnerDetailPageProps {
  initialPartner?: Partner | null;
  initialProducts?: Product[];
  initialSettings?: SiteSettings;
}

export function PartnerDetailPage({ initialPartner, initialProducts, initialSettings }: PartnerDetailPageProps = {}) {
  const { partnerSlug } = useParams<{ partnerSlug: string }>();
  const { t } = useLang();
  const { data: partner, loading, error } = usePartner(partnerSlug, initialPartner);
  const { data: products } = usePartnerProducts(partner?.id, initialProducts);
  const { data: settings } = useSiteSettings(initialSettings);

  const phone = settings?.phone || '+91 7488095803';
  const whatsapp = settings?.whatsapp || phone;

  useSEO({
    title: partner ? `${partner.name} — OEM Partner` : 'Partner',
    description: partner?.seo_description || partner?.positioning || 'OEM partner details.',
    canonical: `https://www.shyamalikrishna.com/partners/${partnerSlug}`,
    structuredData: partner ? {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: partner.name,
      description: partner.positioning || partner.overview || '',
    } : undefined,
  });

  if (loading) {
    return (
      <div className="container-site py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="container-site py-8">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Not Found' }]} />
        <ErrorState message={t('This partner could not be found.', 'यह पार्टनर नहीं मिल सका।')} />
      </div>
    );
  }

  const whatsappMsg = `Hello, I am interested in ${partner.name} machinery. Could you please provide more information?`;

  return (
    <div>
      <section className="bg-charcoal text-ivory py-12 lg:py-20">
        <div className="container-site">
          <Breadcrumbs items={[
            { label: 'Partners', href: '/partners' },
            { label: partner.name },
          ]} />
          <div className="max-w-3xl mt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gold text-charcoal flex items-center justify-center shrink-0">
                <span className="heading-serif text-3xl font-bold">{partner.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="heading-serif text-3xl md:text-4xl lg:text-5xl text-ivory">{partner.name}</h1>
                {partner.origin_country && (
                  <p className="text-gold-300 text-sm mt-1">{partner.origin_country}</p>
                )}
              </div>
            </div>
            {partner.tagline && (
              <p className="text-xl text-gold-300 font-medium mb-4">{partner.tagline}</p>
            )}
            {partner.positioning && (
              <p className="text-lg text-ivory/80 leading-relaxed">{partner.positioning}</p>
            )}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-8">
              {partner.overview && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('Overview', 'अवलोकन')}</h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">{partner.overview}</p>
                  </div>
                </Reveal>
              )}

              {partner.partnership_context && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('Partnership Context', 'साझेदारी संदर्भ')}</h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">{partner.partnership_context}</p>
                  </div>
                </Reveal>
              )}

              {partner.why_partnership_matters && (
                <Reveal>
                  <div className="p-6 bg-bone border-l-4 border-gold">
                    <h2 className="heading-serif text-xl text-charcoal mb-2">{t('Why This Partnership Matters', 'यह साझेदारी क्यों मायने रखती है')}</h2>
                    <p className="text-stone leading-relaxed">{partner.why_partnership_matters}</p>
                  </div>
                </Reveal>
              )}

              {/* Products from this partner */}
              {(products || []).length > 0 && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-6">{t('Products We Carry', 'हमारे उत्पाद')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {products!.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="bg-charcoal text-ivory p-6 sticky top-24">
                <h3 className="heading-serif text-lg text-ivory mb-4">
                  {t('Enquire about', 'पूछताछ करें')} {partner.name}
                </h3>
                <p className="text-sm text-ivory/70 mb-4">
                  {t(
                    'Want to know more about our partnership or the products we carry from this brand?',
                    'हमारी साझेदारी या इस ब्रांड के उत्पादों के बारे में और जानना चाहते हैं?'
                  )}
                </p>
                <div className="space-y-3">
                  <Link href="/enquire" className="btn-gold w-full">
                    {t('Send an Enquiry', 'पूछताछ भेजें')}
                  </Link>
                  <a href={telLink(phone)} className="btn-outline border-ivory/30 text-ivory hover:bg-ivory hover:text-charcoal w-full">
                    <Phone className="w-4 h-4" /> {t('Call', 'कॉल')}
                  </a>
                  <a href={whatsappLink(whatsapp, whatsappMsg)} target="_blank" rel="noopener noreferrer" className="btn-field w-full">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
