'use client';
import type { Category, Partner, Product, Service, SiteSettings } from '@/lib/types';

import Link from 'next/link';
import {
  ArrowRight, Phone, MessageCircle, ShieldCheck, Wrench, Landmark,
  MapPin, Shovel, Sprout, Leaf, Wheat, Package, Wrench as Specialist,
  Handshake, Banknote, FileText,
} from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useCategories, usePartners, useProducts, useServices, useSiteSettings } from '@/lib/hooks';
import { ProductCard } from '@/components/products/ProductCard';
import { Reveal } from '@/components/ui/Reveal';
import { PartnerLogo } from '@/components/ui/PartnerLogo';
import { SectionHeading } from '@/components/ui/Section';
import { telLink, whatsappLink } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'tillage-soil-preparation': <Shovel className="w-6 h-6" />,
  'sowing-seeding': <Sprout className="w-6 h-6" />,
  'residue-management': <Leaf className="w-6 h-6" />,
  'harvesting': <Wheat className="w-6 h-6" />,
  'post-harvest': <Package className="w-6 h-6" />,
  'specialist-implements': <Specialist className="w-6 h-6" />,
};

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'sales-consultation': <Handshake className="w-6 h-6" />,
  'after-sales-service': <Wrench className="w-6 h-6" />,
  'spare-parts': <Package className="w-6 h-6" />,
  'finance-emi': <Banknote className="w-6 h-6" />,
  'subsidy-assistance': <Landmark className="w-6 h-6" />,
};

interface HomePageProps {
  initialCategories?: Category[];
  initialPartners?: Partner[];
  initialProducts?: Product[];
  initialServices?: Service[];
  initialSettings?: SiteSettings;
}

export function HomePage({ initialCategories, initialPartners, initialProducts, initialServices, initialSettings }: HomePageProps = {}) {
  const { t } = useLang();
  const { data: categories } = useCategories(initialCategories);
  const { data: partners } = usePartners(initialPartners);
  const { data: products } = useProducts(undefined, initialProducts);
  const { data: services } = useServices(initialServices);
  const { data: settings } = useSiteSettings(initialSettings);

  const phone = settings?.phone || '+91 7488095803';
  const whatsapp = settings?.whatsapp || phone;
  const featuredProducts = (products || []).slice(0, 6);

  useSEO({
    title: 'Shyamali Krishna Automobile | Premium Agricultural Machinery Dealer, Bihar',
    description: 'Authorized dealer and distributor of premium agricultural machinery across Bihar — Maschio Gaspardo, Sitara AgroTech, Govind, Agrimax, Hazarix. Rotavators, seeders, threshers, harvesters with genuine parts and service.',
    canonical: 'https://www.shyamalikrishna.com/',
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Shyamali Krishna Automobile Private Limited',
        url: 'https://www.shyamalikrishna.com',
        telephone: phone,
        email: settings?.email || 'info@shyamalikrishna.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'KH-56, PLTO-357, Kendua',
          addressLocality: 'Nawada',
          addressRegion: 'Bihar',
          postalCode: '805110',
          addressCountry: 'IN',
        },
        gstID: settings?.gst || '10ABUCS4908F1ZA',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Shyamali Krishna Automobile',
        url: 'https://www.shyamalikrishna.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.shyamalikrishna.com/resources/machinery-guides?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  });

  const whyChoosePoints = [
    {
      icon: <ShieldCheck className="w-7 h-7 text-gold" />,
      title: t('Authorized Multi-OEM Portfolio', 'अधिकृत मल्टी-OEM पोर्टफोलियो'),
      desc: t(
        'We carry implements from Maschio Gaspardo, Sitara AgroTech, Govind, Agrimax, and Hazarix — so you choose the right machine, not just the available one.',
        'हम Maschio Gaspardo, Sitara AgroTech, Govind, Agrimax, और Hazarix के उपकरण प्रदान करते हैं — ताकि आप सही मशीन चुनें, न केवल उपलब्ध।'
      ),
    },
    {
      icon: <Wrench className="w-7 h-7 text-gold" />,
      title: t('Genuine Parts and Service', 'असली पार्ट्स और सर्विस'),
      desc: t(
        'Our after-sales support includes technicians familiar with the implements and a stock of genuine wear components.',
        'हमारी बिक्री के बाद की सहायता में तकनीशियन और असली घिसने वाले घटकों का स्टॉक शामिल है।'
      ),
    },
    {
      icon: <Banknote className="w-7 h-7 text-gold" />,
      title: t('Subsidy and Finance Assistance', 'सब्सिडी और वित्त सहायता'),
      desc: t(
        'We help you navigate applicable government subsidy schemes and financing options for your machinery purchase.',
        'हम आपको लागू सरकारी सब्सिडी योजनाओं और वित्तपोषण विकल्पों को नेविगेट करने में मदद करते हैं।'
      ),
    },
    {
      icon: <MapPin className="w-7 h-7 text-gold" />,
      title: t('Regional Presence, National Standards', 'क्षेत्रीय उपस्थिति, राष्ट्रीय मानक'),
      desc: t(
        'Based in Nawada, Bihar, we serve the region with the professionalism and product depth expected of a national-grade dealer.',
        'नवादा, बिहार में स्थित, हम क्षेत्र को राष्ट्रीय स्तर के डीलर की पेशेवरियत और उत्पाद गहराई के साथ सेवा प्रदान करते हैं।'
      ),
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-charcoal overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/homepage-hero-john-deere.webp"
            alt="John Deere tractor drawing a mounted implement through a Bihar field at golden hour"
            className="w-full h-full object-cover"
            fetchPriority="high"
            width={1672}
            height={941}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-transparent" />
        </div>
        <div className="relative container-site py-20 lg:py-32">
          <div className="max-w-2xl">
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-gold-300 mb-4 block">
              {t('Authorized Dealer & Distributor', 'अधिकृत डीलर और वितरक')}
            </span>
            <h1 className="heading-serif text-4xl md:text-5xl lg:text-6xl text-ivory text-balance leading-tight">
              {t('Modern Machinery for Modern Farming.', 'आधुनिक खेती के लिए आधुनिक मशीनरी।')}
            </h1>
            <p className="mt-6 text-lg text-ivory/80 leading-relaxed max-w-xl">
              {t(
                'Authorized dealer and distributor of premium agricultural machinery across Bihar — from Italian-engineered tillage systems to precision seeders, threshers, and harvesting equipment.',
                'बिहार भर में प्रीमियम कृषि मशीनरी के अधिकृत डीलर और वितरक — इतालवी-इंजीनियर्ड टिलेज सिस्टम से लेकर प्रेसिशन सीडर, थ्रेशर, और हार्वेस्टिंग उपकरण तक।'
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/portfolio" className="btn-gold">
                {t('Explore the Portfolio', 'पोर्टफोलियो देखें')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className="btn-outline border-ivory/30 text-ivory hover:bg-ivory hover:text-charcoal">
                {t('Talk to Our Team', 'हमारी टीम से बात करें')}
              </Link>
            </div>
          </div>
        </div>

        {/*
          Real markup, not the badge baked into the hero artwork: `object-cover`
          crops the image to whatever aspect the section happens to be, and the
          artwork's own badge sits in the bottom tenth, so it is the first thing
          to disappear on a wide viewport.
        */}
        <div className="pointer-events-none absolute bottom-6 right-6 hidden items-center gap-2 border border-gold-300/70 bg-field-800/85 px-5 py-2.5 backdrop-blur-sm md:flex">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ivory">
            {t('Authorized Dealer of', 'अधिकृत डीलर')}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">
            John Deere
          </span>
        </div>
      </section>

      {/* Trust band */}
      <section className="bg-field text-ivory py-6">
        <div className="container-site">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 text-center">
            <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
              <ShieldCheck className="w-5 h-5 text-gold-300" />
              {t('Authorized', 'अधिकृत')}
            </div>
            <div className="hidden md:block w-px h-4 bg-ivory/20" />
            <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
              <Wrench className="w-5 h-5 text-gold-300" />
              {t('Established', 'स्थापित')}
            </div>
            <div className="hidden md:block w-px h-4 bg-ivory/20" />
            <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
              <MapPin className="w-5 h-5 text-gold-300" />
              {t('Regionally Present', 'क्षेत्रीय रूप से उपस्थित')}
            </div>
          </div>
        </div>
      </section>

      {/* Company introduction */}
      <section className="section-padding">
        <div className="container-site">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-5">
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-gold mb-4 block">
                  {t('Who We Are', 'हम कौन हैं')}
                </span>
                <h2 className="heading-serif text-3xl md:text-4xl text-charcoal mb-6 text-balance">
                  {t(
                    'A multi-brand agricultural machinery dealer built for Bihar farmers.',
                    'बिहार के किसानों के लिए बना एक मल्टी-ब्रांड कृषि मशीनरी डीलर।'
                  )}
                </h2>
              </div>
              <div className="lg:col-span-7 space-y-4 text-stone leading-relaxed">
                <p>
                  {t(
                    'Shyamali Krishna Automobile Private Limited is an authorized dealer and distributor of premium agricultural machinery, serving Nawada, Bihar and adjoining regions. We bring together implements from leading Indian and international manufacturers under one roof — giving farmers, custom-hiring operators, and institutional buyers genuine choice rather than a single-brand constraint.',
                    'श्यामली कृष्णा ऑटोमोबाइल प्राइवेट लिमिटेड प्रीमियम कृषि मशीनरी की एक अधिकृत डीलर और वितरक है, जो नवादा, बिहार और आसपास के क्षेत्रों को सेवा प्रदान करती है। हम प्रमुख भारतीय और अंतर्राष्ट्रीय निर्माताओं के उपकरणों को एक ही छत के नीचे लाते हैं।'
                  )}
                </p>
                <p>
                  {t(
                    'Our approach is advisory, not transactional. We assess your soil type, crop rotation, tractor power, and operating scale before recommending an implement — then back it with genuine parts, regional service, and assistance with financing and subsidy schemes.',
                    'हमारा दृष्टिकोण सलाहकार है, न कि लेनदेन केंद्रित। हम आपकी मिट्टी के प्रकार, फसल चक्र, ट्रैक्टर शक्ति, और परिचालन पैमाने का आकलन करते हैं, फिर एक उपकरण की सिफारिश करते हैं।'
                  )}
                </p>
                <Link href="/about" className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-gold hover:text-gold-600 transition-colors">
                  {t('Learn more about us', 'हमारे बारे में और जानें')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Six-stage farming cycle */}
      <section className="bg-bone py-16 lg:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={t('The Mechanization Cycle', 'यांत्रिकीकरण चक्र')}
              title={t('Six Stages of Farm Mechanization', 'खेत यांत्रिकीकरण के छह चरण')}
              subtitle={t(
                'From soil preparation to post-harvest — our portfolio covers every stage of the farming cycle with the right implement for each operation.',
                'मिट्टी की तैयारी से लेकर फसल कटाई के बाद तक — हमारा पोर्टफोलियो खेती चक्र के हर चरण को कवर करता है।'
              )}
              center
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px mt-12 bg-bone-300 border border-bone-300">
            {(categories || []).map((cat, index) => (
              <Reveal key={cat.id} delay={index * 50}>
                <Link
                  href={`/portfolio/${cat.slug}`}
                  className="group flex flex-col bg-white p-6 hover:bg-bone transition-colors min-h-[200px]"
                >
                  <div className="w-12 h-12 bg-charcoal text-gold flex items-center justify-center mb-4 group-hover:bg-gold group-hover:text-charcoal transition-colors">
                    {CATEGORY_ICONS[cat.slug] || <Shovel className="w-6 h-6" />}
                  </div>
                  <div className="text-xs text-stone mb-1">Stage {cat.display_order}</div>
                  <h3 className="heading-serif text-lg text-charcoal mb-2 group-hover:text-gold transition-colors">
                    {t(cat.name, cat.name_hi || cat.name)}
                  </h3>
                  {cat.short_description && (
                    <p className="text-sm text-stone line-clamp-2 flex-1">
                      {t(cat.short_description, cat.short_description_hi || cat.short_description)}
                    </p>
                  )}
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

      {/* Featured OEM partners */}
      <section className="section-padding">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={t('OEM Partners', 'OEM पार्टनर')}
              title={t('Brands We Are Authorized to Carry', 'हमारे अधिकृत ब्रांड्स')}
              subtitle={t(
                'A curated multi-OEM portfolio — Italian engineering, Indian manufacturing, and specialist implement makers.',
                'एक चयनित मल्टी-OEM पोर्टफोलियो — इतालवी इंजीनियरिंग, भारतीय निर्माण, और विशेषज्ञ उपकरण निर्माता।'
              )}
              actionLabel={t('View all partners', 'सभी पार्टनर देखें')}
              actionHref="/partners"
            />
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-12">
            {(partners || []).map((partner, index) => (
              <Reveal key={partner.id} delay={index * 50}>
                <Link
                  href={`/partners/${partner.slug}`}
                  className="group flex flex-col items-center text-center p-6 bg-white border border-bone-300 hover:border-gold transition-all min-h-[160px]"
                >
                  <PartnerLogo
                    partner={partner}
                    className="w-20 h-20 mb-3 group-hover:scale-105 transition-transform"
                    letterClassName="text-2xl"
                  />
                  <span className="text-sm font-medium text-charcoal group-hover:text-gold transition-colors">
                    {partner.name}
                  </span>
                  {partner.origin_country && (
                    <span className="text-xs text-stone mt-1">{partner.origin_country}</span>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-charcoal py-16 lg:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={t('Why Choose Us', 'हमें क्यों चुनें')}
              title={t('Why Farmers and Institutions Choose Us', 'किसान और संस्थाएं हमें क्यों चुनते हैं')}
              light
              center
            />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {whyChoosePoints.map((point, index) => (
              <Reveal key={index} delay={index * 50}>
                <div className="flex gap-4 p-6 border border-ivory/10 hover:border-gold/30 transition-colors">
                  <div className="shrink-0">{point.icon}</div>
                  <div>
                    <h3 className="heading-serif text-lg text-ivory mb-2">{point.title}</h3>
                    <p className="text-sm text-ivory/70 leading-relaxed">{point.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="section-padding">
          <div className="container-site">
            <Reveal>
              <SectionHeading
                eyebrow={t('Featured Products', 'विशेष उत्पाद')}
                title={t('Machinery from Our Portfolio', 'हमारे पोर्टफोलियो से मशीनरी')}
                actionLabel={t('View all products', 'सभी उत्पाद देखें')}
                actionHref="/portfolio"
              />
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {featuredProducts.map((product, index) => (
                <Reveal key={product.id} delay={index * 50}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="bg-bone py-16 lg:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={t('Services', 'सेवाएं')}
              title={t('Beyond the Sale', 'बिक्री के बाद')}
              subtitle={t(
                'We support the full lifecycle of your machinery — from selection to service, parts, financing, and subsidy coordination.',
                'हम आपकी मशीनरी के पूर्ण जीवनचक्र का समर्थन करते हैं — चयन से सेवा, पार्ट्स, वित्त, और सब्सिडी समन्वय तक।'
              )}
              center
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
            {(services || []).map((service, index) => (
              <Reveal key={service.id} delay={index * 50}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex flex-col items-center text-center p-6 bg-white border border-bone-300 hover:border-gold transition-all min-h-[180px]"
                >
                  <div className="w-12 h-12 bg-charcoal text-gold flex items-center justify-center mb-4 group-hover:bg-gold group-hover:text-charcoal transition-colors">
                    {SERVICE_ICONS[service.slug] || <Wrench className="w-6 h-6" />}
                  </div>
                  <h3 className="text-sm font-medium text-charcoal group-hover:text-gold transition-colors mb-2">
                    {t(service.name, service.name_hi || service.name)}
                  </h3>
                  {service.short_description && (
                    <p className="text-xs text-stone line-clamp-2">
                      {t(service.short_description, service.short_description_hi || service.short_description)}
                    </p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust/legal band */}
      <section className="bg-field py-12">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-ivory">
            <div>
              <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold-300 mb-3">
                {t('Corporate Identity', 'कॉर्पोरेट पहचान')}
              </h3>
              <p className="text-ivory font-medium mb-2">
                {settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'}
              </p>
              <p className="text-sm text-ivory/70 leading-relaxed">
                {settings?.office_line1}<br />
                {settings?.office_line2}<br />
                {settings?.office_line3}<br />
                {settings?.office_line4}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold-300 mb-3">
                {t('Registration', 'पंजीकरण')}
              </h3>
              <p className="text-sm text-ivory/70 mb-2">
                <span className="text-ivory/50">GST: </span>
                {settings?.gst || '10ABUCS4908F1ZA'}
              </p>
              <p className="text-sm text-ivory/70">
                <span className="text-ivory/50">{t('Hours', 'समय')}: </span>
                {settings?.hours_weekday || 'Monday–Saturday: 9:00 AM–7:00 PM'}<br />
                <span className="text-ivory/50">{t('Sunday', 'रविवार')}: </span>
                {settings?.hours_sunday || 'On appointment'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final conversion */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="heading-serif text-3xl md:text-4xl text-charcoal mb-4 text-balance">
                {t('Talk to Us About Your Next Implement', 'अपने अगले उपकरण के बारे में बात करें')}
              </h2>
              <p className="text-stone mb-8">
                {t(
                  'Whether you are a farmer, a custom-hiring operator, or an institutional buyer — our team will help you select, finance, and service the right machinery.',
                  'चाहे आप एक किसान हों, कस्टम-हायरिंग ऑपरेटर, या संस्थागत खरीददार — हमारी टीम आपको सही मशीनरी चुनने, वित्त, और सेवा में मदद करेगी।'
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/enquire" className="btn-primary">
                  {t('Send an Enquiry', 'पूछताछ भेजें')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={telLink(phone)} className="btn-outline">
                  <Phone className="w-4 h-4" />
                  {t('Call', 'कॉल करें')}
                </a>
                <a
                  href={whatsappLink(whatsapp, 'Hello, I would like to discuss agricultural machinery.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-field"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('WhatsApp', 'व्हाट्सएप')}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
