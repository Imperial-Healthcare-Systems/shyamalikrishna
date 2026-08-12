'use client';
import type { SiteSettings } from '@/lib/types';

import Link from 'next/link';
import { ArrowRight, Phone, MessageCircle, ShieldCheck, Wrench, Banknote, Landmark } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useSiteSettings } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { telLink, whatsappLink } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface AboutPageProps {
  initialSettings?: SiteSettings;
}

export function AboutPage({ initialSettings }: AboutPageProps = {}) {
  const { t } = useLang();
  const { data: settings } = useSiteSettings(initialSettings);
  const phone = settings?.phone || '+91 7488095803';
  const whatsapp = settings?.whatsapp || phone;

  useSEO({
    title: 'About Us — Shyamali Krishna Automobile',
    description: 'Shyamali Krishna Automobile Private Limited is an authorized multi-brand agricultural machinery dealer serving Nawada, Bihar and adjoining regions. Learn about our advisory approach, OEM partnerships, and after-sales commitment.',
    canonical: 'https://www.shyamalikrishna.com/about',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Shyamali Krishna Automobile',
      url: 'https://www.shyamalikrishna.com/about',
    },
  });

  const sections = [
    {
      title: t('Who We Are', 'हम कौन हैं'),
      body: t(
        'Shyamali Krishna Automobile Private Limited is an authorized dealer and distributor of agricultural machinery, headquartered in Nawada, Bihar. We bring together implements from leading Indian and international manufacturers, offering farmers and institutional buyers genuine choice across tillage, sowing, residue management, harvesting, post-harvest, and specialist applications.',
        'श्यामली कृष्णा ऑटोमोबाइल प्राइवेट लिमिटेड नवादा, बिहार में स्थित कृषि मशीनरी की एक अधिकृत डीलर और वितरक है। हम प्रमुख भारतीय और अंतर्राष्ट्रीय निर्माताओं के उपकरण एक साथ लाते हैं।'
      ),
    },
    {
      title: t('What We Do', 'हम क्या करते हैं'),
      body: t(
        'We supply, service, and support agricultural machinery across Bihar. Our role spans the full ownership lifecycle — from helping you select the right implement, to providing documentation, after-sales service, genuine spare parts, and coordination with financing and subsidy channels.',
        'हम बिहार भर में कृषि मशीनरी की आपूर्ति, सेवा और सहायता करते हैं। हमारी भूमिका स्वामित्व के पूर्ण जीवनचक्र को कवर करती है।'
      ),
    },
    {
      title: t('Selection Advisory', 'चयन सलाह'),
      body: t(
        'We do not push a single brand. We assess your soil type, crop rotation, tractor horsepower, and operating scale, then recommend the most suitable implement from our multi-OEM portfolio. This advisory approach is central to how we work.',
        'हम एक ही ब्रांड को नहीं धकेलते। हम आपकी मिट्टी, फसल चक्र, ट्रैक्टर शक्ति, और परिचालन पैमाने का आकलन करते हैं, फिर उपयुक्त उपकरण की सिफारिश करते हैं।'
      ),
    },
    {
      title: t('Sales and Documentation', 'बिक्री और प्रलेखन'),
      body: t(
        'We handle the purchase process end to end — from product demonstration and tractor compatibility verification to purchase documentation and delivery coordination.',
        'हम खरीद प्रक्रिया को शुरू से अंत तक संभालते हैं — उत्पाद प्रदर्शन से लेकर दस्तावेज़ीकरण और वितरण समन्वय तक।'
      ),
    },
    {
      title: t('After-Sales Service', 'बिक्री के बाद सेवा'),
      body: t(
        'We provide after-sales service for the machinery we supply, with technicians familiar with the implements and access to genuine parts. Our service support is designed to minimise downtime during critical field operations.',
        'हम जो मशीनरी आपूर्ति करते हैं उसके लिए बिक्री के बाद की सेवा प्रदान करते हैं, तकनीशियनों के साथ जो उपकरणों से परिचित हैं।'
      ),
    },
    {
      title: t('Subsidy and Finance Coordination', 'सब्सिडी और वित्त समन्वय'),
      body: t(
        'We help farmers understand and apply for applicable government subsidy schemes and access financing options for machinery purchases. We provide information, documentation support, and coordination — not financial advice.',
        'हम किसानों को लागू सरकारी सब्सिडी योजनाओं को समझने और वित्तपोषण विकल्पों तक पहुंचने में मदद करते हैं।'
      ),
    },
  ];

  const approachPoints = [
    { icon: <ShieldCheck className="w-6 h-6 text-gold" />, label: t('Advisory, not transactional', 'सलाहकार, लेनदेन नहीं') },
    { icon: <Wrench className="w-6 h-6 text-gold" />, label: t('Multi-OEM, genuinely independent', 'मल्टी-OEM, वास्तव में स्वतंत्र') },
    { icon: <Landmark className="w-6 h-6 text-gold" />, label: t('Regional service, national standards', 'क्षेत्रीय सेवा, राष्ट्रीय मानक') },
    { icon: <Banknote className="w-6 h-6 text-gold" />, label: t('Subsidy and finance assistance', 'सब्सिडी और वित्त सहायता') },
  ];

  return (
    <div>
      <PageHero
        eyebrow={t('About Us', 'हमारे बारे में')}
        title={t('Rooted in Bihar. Built to International Standards.', 'बिहार में जड़ें। अंतर्राष्ट्रीय मानकों के अनुरूप।')}
        subtitle={t(
          'An authorized multi-brand agricultural machinery dealer serving Nawada and adjoining regions — with an advisory approach, genuine parts, and regional after-sales support.',
          'नवादा और आसपास के क्षेत्रों को सेवा देने वाला एक अधिकृत मल्टी-ब्रांड कृषि मशीनरी डीलर।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'About', href: '/about' }]} />}
        image="/about-company.webp"
        imageAlt="Shyamali Krishna Automobile dealership yard with tractors and implements on display"
      />

      {/* Main content */}
      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-8">
              {sections.map((section, index) => (
                <Reveal key={index} delay={index * 50}>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{section.title}</h2>
                    <p className="text-stone leading-relaxed">{section.body}</p>
                  </div>
                </Reveal>
              ))}

              {/* Our Approach */}
              <Reveal>
                <div className="p-6 bg-bone border-l-4 border-gold">
                  <h2 className="heading-serif text-2xl text-charcoal mb-4">{t('Our Approach', 'हमारा दृष्टिकोण')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {approachPoints.map((point, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="shrink-0">{point.icon}</div>
                        <span className="text-sm text-charcoal font-medium">{point.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* OEM Partnerships */}
              <Reveal>
                <div>
                  <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('OEM Partnerships', 'OEM साझेदारी')}</h2>
                  <p className="text-stone leading-relaxed mb-4">
                    {t(
                      'Our partners include Maschio Gaspardo (Italy), Sitara AgroTech, Gobind Alloys (Govind), Agrimax, Hazarix, and select harvester OEMs. Each partnership is chosen for product quality, suitability to Bihar conditions, and the availability of parts and service support.',
                      'हमारे पार्टनर में Maschio Gaspardo (इटली), Sitara AgroTech, Gobind Alloys (Govind), Agrimax, Hazarix, और चुने हुए हार्वेस्टर OEM शामिल हैं।'
                    )}
                  </p>
                  <Link href="/partners" className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-600 transition-colors">
                    {t('Explore our OEM partners', 'हमारे OEM पार्टनर देखें')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>

              {/* Corporate Identity */}
              <Reveal>
                <div className="border-t border-bone-300 pt-6">
                  <h2 className="heading-serif text-2xl text-charcoal mb-4">{t('Corporate Identity', 'कॉर्पोरेट पहचान')}</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-stone mb-1">{t('Legal Name', 'कानूनी नाम')}</dt>
                      <dd className="text-charcoal font-medium">{settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'}</dd>
                    </div>
                    <div>
                      <dt className="text-stone mb-1">GST</dt>
                      <dd className="text-charcoal font-medium">{settings?.gst || '10ABUCS4908F1ZA'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-stone mb-1">{t('Registered Office', 'पंजीकृत कार्यालय')}</dt>
                      <dd className="text-charcoal font-medium">
                        {settings?.office_line1}<br />
                        {settings?.office_line2}<br />
                        {settings?.office_line3}<br />
                        {settings?.office_line4}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link href="/about/leadership" className="btn-ghost text-sm">{t('Leadership', 'नेतृत्व')}</Link>
                    <Link href="/about/legacy" className="btn-ghost text-sm">{t('Legacy', 'विरासत')}</Link>
                  </div>
                </div>
              </Reveal>

              {/* Closing CTA */}
              <Reveal>
                <div className="bg-charcoal text-ivory p-8 text-center">
                  <h2 className="heading-serif text-2xl text-ivory mb-4">
                    {t('Ready to find the right implement?', 'सही उपकरण खोजने के लिए तैयार?')}
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/contact" className="btn-gold">{t('Contact Us', 'संपर्क करें')}</Link>
                    <a href={telLink(phone)} className="btn-outline border-ivory/30 text-ivory hover:bg-ivory hover:text-charcoal">
                      <Phone className="w-4 h-4" /> {t('Call', 'कॉल')}
                    </a>
                    <a href={whatsappLink(whatsapp, 'Hello, I would like to know more about your machinery.')} target="_blank" rel="noopener noreferrer" className="btn-field">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-bone p-6">
                <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold mb-3">{t('Quick Contact', 'त्वरित संपर्क')}</h3>
                <div className="space-y-3 text-sm">
                  <a href={telLink(phone)} className="flex items-center gap-2 text-charcoal hover:text-gold transition-colors">
                    <Phone className="w-4 h-4 text-gold" /> {phone}
                  </a>
                  <a href={`mailto:${settings?.email || 'info@shyamalikrishna.com'}`} className="flex items-center gap-2 text-charcoal hover:text-gold transition-colors break-all">
                    {settings?.email || 'info@shyamalikrishna.com'}
                  </a>
                </div>
              </div>
              <div className="bg-field text-ivory p-6">
                <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold-300 mb-3">{t('Operating Hours', 'कार्य समय')}</h3>
                <p className="text-sm text-ivory/80">{settings?.hours_weekday || 'Monday–Saturday: 9:00 AM–7:00 PM'}</p>
                <p className="text-sm text-ivory/80 mt-1">{settings?.hours_sunday || 'Sunday: On appointment'}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
