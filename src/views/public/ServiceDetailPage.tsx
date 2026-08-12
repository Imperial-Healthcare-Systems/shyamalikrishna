'use client';
import type { Service, SiteSettings } from '@/lib/types';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useService, useSiteSettings } from '@/lib/hooks';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { Reveal } from '@/components/ui/Reveal';
import { ServiceEnquiryForm } from '@/components/forms/ServiceEnquiryForm';
import { telLink, whatsappLink } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface ServiceDetailPageProps {
  initialService?: Service | null;
  initialSettings?: SiteSettings;
}

export function ServiceDetailPage({ initialService, initialSettings }: ServiceDetailPageProps = {}) {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const { t } = useLang();
  const { data: service, loading, error } = useService(serviceSlug, initialService);
  const { data: settings } = useSiteSettings(initialSettings);

  const phone = settings?.phone || '+91 7488095803';
  const whatsapp = settings?.whatsapp || phone;

  useSEO({
    title: service ? `${service.name} — Service` : 'Service',
    description: service?.seo_description || service?.short_description || 'Service details.',
    canonical: `https://www.shyamalikrishna.com/services/${serviceSlug}`,
  });

  if (loading) {
    return (
      <div className="container-site py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container-site py-8">
        <Breadcrumbs items={[{ label: 'Services', href: '/services' }, { label: 'Not Found' }]} />
        <ErrorState message={t('This service could not be found.', 'यह सेवा नहीं मिल सकी।')} />
      </div>
    );
  }

  const whatsappMsg = `Hello, I would like to know more about your ${service.name}.`;

  return (
    <div>
      <section className="relative bg-charcoal text-ivory py-12 lg:py-20 overflow-hidden">
        {service.image_url && (
          <div className="absolute inset-0">
            <img
              src={service.image_url}
              alt={`${service.name} at Shyamali Krishna Automobile`}
              className="w-full h-full object-cover opacity-40"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/40" />
          </div>
        )}
        <div className="relative container-site">
          <Breadcrumbs items={[
            { label: 'Services', href: '/services' },
            { label: service.name },
          ]} />
          <div className="max-w-3xl mt-6">
            <h1 className="heading-serif text-3xl md:text-4xl lg:text-5xl text-ivory mb-4">
              {t(service.name, service.name_hi || service.name)}
            </h1>
            {service.short_description && (
              <p className="text-lg text-ivory/80 leading-relaxed">
                {t(service.short_description, service.short_description_hi || service.short_description)}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7 space-y-6">
              {service.overview && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('Overview', 'अवलोकन')}</h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">
                      {t(service.overview, service.overview_hi || service.overview)}
                    </p>
                  </div>
                </Reveal>
              )}

              {service.what_we_cover && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('What We Cover', 'हम क्या कवर करते हैं')}</h2>
                    <ul className="space-y-2">
                      {service.what_we_cover.split(';').map((item, index) => (
                        item.trim() && (
                          <li key={index} className="flex items-start gap-2 text-stone">
                            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0 mt-2" />
                            <span>{item.trim()}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              <Reveal>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <a href={telLink(phone)} className="btn-outline">
                    <Phone className="w-4 h-4" /> {t('Call Us', 'कॉल करें')}
                  </a>
                  <a href={whatsappLink(whatsapp, whatsappMsg)} target="_blank" rel="noopener noreferrer" className="btn-field">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </Reveal>
            </div>

            <aside className="lg:col-span-5">
              <div className="bg-white border border-bone-300 p-6 sticky top-24">
                <h3 className="heading-serif text-lg text-charcoal mb-4">
                  {t('Make a Request', 'अनुरोध करें')}
                </h3>
                <ServiceEnquiryForm
                  serviceType={service.name}
                  sourcePage={`service:${service.slug}`}
                />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
