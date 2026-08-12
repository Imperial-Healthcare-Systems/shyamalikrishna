'use client';
import type { SiteSettings } from '@/lib/types';

import { Phone, Mail, MessageCircle, MapPin, Clock } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useSiteSettings } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Reveal } from '@/components/ui/Reveal';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { telLink, whatsappLink } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface ContactPageProps {
  initialSettings?: SiteSettings;
}

export function ContactPage({ initialSettings }: ContactPageProps = {}) {
  const { t } = useLang();
  const { data: settings } = useSiteSettings(initialSettings);

  const phone = settings?.phone || '+91 7488095803';
  const email = settings?.email || 'info@shyamalikrishna.com';
  const whatsapp = settings?.whatsapp || phone;
  const mapsQuery = settings?.maps_query || 'Nawada, Bihar, India';

  useSEO({
    title: 'Contact Us — Shyamali Krishna Automobile',
    description: 'Contact Shyamali Krishna Automobile in Nawada, Bihar. Phone: +91 7488095803. Email: info@shyamalikrishna.com. Authorized agricultural machinery dealer for Bihar.',
    canonical: 'https://www.shyamalikrishna.com/contact',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Shyamali Krishna Automobile Private Limited',
      telephone: phone,
      email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings?.office_line2 || 'KH-56, PLTO-357, Kendua',
        addressLocality: 'Nawada',
        addressRegion: 'Bihar',
        postalCode: '805110',
        addressCountry: 'IN',
      },
      openingHours: 'Mo-Sa 09:00-19:00',
      url: 'https://www.shyamalikrishna.com',
    },
  });

  return (
    <div>
      <PageHero
        eyebrow={t('Contact', 'संपर्क')}
        title={t('Contact Us', 'हमसे संपर्क करें')}
        subtitle={t(
          'Reach our team in Nawada, Bihar — by phone, WhatsApp, email, or the enquiry form below.',
          'नवादा, बिहार में हमारी टीम तक पहुंचें — फोन, व्हाट्सएप, ईमेल, या नीचे दिए गए फॉर्म द्वारा।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'Contact', href: '/contact' }]} />}
        image="/contact.webp"
        imageAlt="The Shyamali Krishna Automobile showroom in Nawada, Bihar"
      />

      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Contact info */}
            <div className="lg:col-span-5 space-y-6">
              <Reveal>
                <div className="bg-white border border-bone-300 p-6">
                  <h2 className="heading-serif text-xl text-charcoal mb-4">{t('Contact Information', 'संपर्क जानकारी')}</h2>
                  <ul className="space-y-4 text-sm">
                    <li>
                      <a href={telLink(phone)} className="flex items-start gap-3 hover:text-gold transition-colors group">
                        <Phone className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <div>
                          <div className="text-stone text-xs mb-0.5">{t('Phone', 'फ़ोन')}</div>
                          <div className="text-charcoal font-medium group-hover:text-gold transition-colors">{phone}</div>
                        </div>
                      </a>
                    </li>
                    <li>
                      <a href={`mailto:${email}`} className="flex items-start gap-3 hover:text-gold transition-colors group">
                        <Mail className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <div>
                          <div className="text-stone text-xs mb-0.5">{t('Email', 'ईमेल')}</div>
                          <div className="text-charcoal font-medium group-hover:text-gold transition-colors break-all">{email}</div>
                        </div>
                      </a>
                    </li>
                    <li>
                      <a href={whatsappLink(whatsapp, 'Hello, I would like to enquire about agricultural machinery.')} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-gold transition-colors group">
                        <MessageCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <div>
                          <div className="text-stone text-xs mb-0.5">WhatsApp</div>
                          <div className="text-charcoal font-medium group-hover:text-gold transition-colors">{whatsapp}</div>
                        </div>
                      </a>
                    </li>
                    <li>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <div>
                          <div className="text-stone text-xs mb-0.5">{t('Office', 'कार्यालय')}</div>
                          <div className="text-charcoal">
                            {settings?.office_line1 && <>{settings.office_line1}<br /></>}
                            {settings?.office_line2 && <>{settings.office_line2}<br /></>}
                            {settings?.office_line3 && <>{settings.office_line3}<br /></>}
                            {settings?.office_line4}
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <div>
                          <div className="text-stone text-xs mb-0.5">{t('Hours', 'समय')}</div>
                          <div className="text-charcoal">
                            {settings?.hours_weekday || 'Monday–Saturday: 9:00 AM–7:00 PM'}<br />
                            {settings?.hours_sunday || 'Sunday: On appointment'}
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-bone-200 text-sm text-stone">
                    <span className="text-stone/60">GST: </span>{settings?.gst || '10ABUCS4908F1ZA'}
                  </div>
                </div>
              </Reveal>

              <Reveal>
                <div className="aspect-[4/3] bg-bone border border-bone-300 overflow-hidden">
                  <iframe
                    title="Office location map"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Reveal>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <Reveal>
                <div className="bg-white border border-bone-300 p-6 lg:p-8">
                  <h2 className="heading-serif text-2xl text-charcoal mb-2">{t('Send an Enquiry', 'पूछताछ भेजें')}</h2>
                  <p className="text-sm text-stone mb-6">
                    {t(
                      'Fill in the form below and our team will get back to you within one business day.',
                      'नीचे दिए गए फॉर्म को भरें और हमारी टीम एक कार्य दिवस के भीतर आपसे संपर्क करेगी।'
                    )}
                  </p>
                  <EnquiryForm sourcePage="contact_page" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
