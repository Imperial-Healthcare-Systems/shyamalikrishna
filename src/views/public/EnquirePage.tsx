'use client';
import type { SiteSettings } from '@/lib/types';

import { Phone, MessageCircle } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useSiteSettings } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Reveal } from '@/components/ui/Reveal';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { telLink, whatsappLink } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface EnquirePageProps {
  initialSettings?: SiteSettings;
}

export function EnquirePage({ initialSettings }: EnquirePageProps = {}) {
  const { t } = useLang();
  const { data: settings } = useSiteSettings(initialSettings);

  const phone = settings?.phone || '+91 7488095803';
  const whatsapp = settings?.whatsapp || phone;

  useSEO({
    title: 'Send an Enquiry — Agricultural Machinery RFQ',
    description: 'Send an enquiry about agricultural machinery, spare parts, service, finance, or subsidy assistance. Our team will respond within one business day.',
    canonical: 'https://www.shyamalikrishna.com/enquire',
  });

  return (
    <div>
      <PageHero
        eyebrow={t('Enquiry', 'पूछताछ')}
        title={t('Send an Enquiry', 'पूछताछ भेजें')}
        subtitle={t(
          'Tell us what you need — a product, spare parts, service, finance consultation, or subsidy assistance. We respond within one business day.',
          'हमें बताएं कि आपको क्या चाहिए — उत्पाद, पार्ट्स, सेवा, वित्त परामर्श, या सब्सिडी सहायता।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'Enquire', href: '/enquire' }]} />}
      />

      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="bg-white border border-bone-300 p-6 lg:p-8">
                  <EnquiryForm sourcePage="enquire_page" enquiryType="Product Enquiry" />
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal>
                <div className="bg-charcoal text-ivory p-6 lg:p-8 sticky top-24">
                  <h2 className="heading-serif text-xl text-ivory mb-4">{t('Other Ways to Reach Us', 'हम तक पहुंचने के अन्य तरीके')}</h2>
                  <div className="space-y-4">
                    <a href={telLink(phone)} className="flex items-center gap-3 text-ivory hover:text-gold transition-colors">
                      <Phone className="w-5 h-5 text-gold" />
                      <div>
                        <div className="text-xs text-ivory/50">{t('Call directly', 'सीधे कॉल करें')}</div>
                        <div className="font-medium">{phone}</div>
                      </div>
                    </a>
                    <a href={whatsappLink(whatsapp, 'Hello, I would like to enquire about agricultural machinery.')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-ivory hover:text-gold transition-colors">
                      <MessageCircle className="w-5 h-5 text-gold" />
                      <div>
                        <div className="text-xs text-ivory/50">WhatsApp</div>
                        <div className="font-medium">{whatsapp}</div>
                      </div>
                    </a>
                  </div>
                  <div className="mt-6 pt-6 border-t border-ivory/10">
                    <p className="text-sm text-ivory/70 leading-relaxed">
                      {t(
                        'Our team is available Monday to Saturday, 9:00 AM to 7:00 PM. Sunday by appointment.',
                        'हमारी टीम सोमवार से शनिवार, सुबह 9:00 से शाम 7:00 तक उपलब्ध है। रविवार को समय पर।'
                      )}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
