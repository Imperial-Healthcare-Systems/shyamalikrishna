'use client';
import type { SiteSettings } from '@/lib/types';

import Link from 'next/link';
import { ArrowRight, Phone, MessageCircle, ShieldCheck, Wrench, Banknote, Landmark, Target, Compass, Check } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useSiteSettings } from '@/lib/hooks';
import { PageHero, SectionHeading } from '@/components/ui/Section';
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
      mainEntity: {
        '@type': 'Organization',
        name: 'Shyamali Krishna Automobile Private Limited',
        url: 'https://www.shyamalikrishna.com',
        employee: [
          {
            '@type': 'Person',
            name: 'Anurag Vasista',
            jobTitle: 'Director',
            image: 'https://www.shyamalikrishna.com/anurag_vasista.png',
          },
          {
            '@type': 'Person',
            name: 'Guriya Kumari',
            jobTitle: 'Director',
            image: 'https://www.shyamalikrishna.com/guriya_kumari.png',
          },
        ],
        member: {
          '@type': 'Person',
          name: 'K. M. Sharma',
          jobTitle: 'Shareholder',
          image: 'https://www.shyamalikrishna.com/km_sharma.png',
        },
      },
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

  // Mission and vision are rendered as a paired band so the two statements read
  // as one commitment — the promise, then the direction it is pointed in.
  const purposeBlocks = [
    {
      icon: <Target className="w-6 h-6 text-gold" />,
      eyebrow: t('Our Mission', 'हमारा मिशन'),
      statement: t(
        'To place well-matched, dependable agricultural machinery in the hands of every farmer and institutional buyer we serve in Bihar — through honest multi-brand advice, complete and transparent documentation, and after-sales support that keeps a machine working through the seasons it was bought for.',
        'बिहार में हम जिन किसानों और संस्थागत खरीदारों की सेवा करते हैं, उन्हें उनकी ज़रूरत के अनुरूप और भरोसेमंद कृषि मशीनरी उपलब्ध कराना — ईमानदार मल्टी-ब्रांड सलाह, पूर्ण और पारदर्शी प्रलेखन, और ऐसी बिक्री-पश्चात सहायता के माध्यम से जो मशीन को उन सभी मौसमों में चालू रखे जिनके लिए वह खरीदी गई थी।'
      ),
      points: [
        {
          title: t('Recommend on fit, never on margin', 'मुनाफ़े पर नहीं, उपयुक्तता पर सिफ़ारिश'),
          body: t(
            'Soil type, crop rotation, tractor horsepower, and operating scale are assessed before any brand is named.',
            'कोई भी ब्रांड बताने से पहले मिट्टी का प्रकार, फसल चक्र, ट्रैक्टर की शक्ति और परिचालन पैमाने का आकलन किया जाता है।'
          ),
        },
        {
          title: t('Hand over the paperwork complete', 'कागज़ात पूरे करके सौंपना'),
          body: t(
            'Invoicing, warranty, compatibility verification, and subsidy documentation are settled at delivery — not chased afterwards.',
            'बिलिंग, वारंटी, अनुकूलता सत्यापन और सब्सिडी दस्तावेज़ डिलीवरी के समय ही पूरे किए जाते हैं — बाद में नहीं।'
          ),
        },
        {
          title: t('Stay accountable after delivery', 'डिलीवरी के बाद भी जवाबदेह'),
          body: t(
            'Genuine parts and familiar technicians remain available for every implement we supply, for as long as it is in service.',
            'हमारे द्वारा आपूर्ति किए गए हर उपकरण के लिए असली पुर्ज़े और जानकार तकनीशियन तब तक उपलब्ध रहते हैं जब तक वह उपयोग में है।'
          ),
        },
      ],
    },
    {
      icon: <Compass className="w-6 h-6 text-gold" />,
      eyebrow: t('Our Vision', 'हमारा विज़न'),
      statement: t(
        'To be the agricultural machinery partner that eastern India trusts across generations — a dealership where international engineering standards and regional service reliability meet at the edge of the field, and where mechanisation is measured by what it returns to the farmer, not by what it costs them.',
        'ऐसा कृषि मशीनरी साझेदार बनना जिस पर पूर्वी भारत पीढ़ियों तक भरोसा करे — एक ऐसी डीलरशिप जहाँ अंतर्राष्ट्रीय इंजीनियरिंग मानक और क्षेत्रीय सेवा विश्वसनीयता खेत के किनारे मिलते हैं, और जहाँ यंत्रीकरण को उसकी लागत से नहीं, बल्कि किसान को मिलने वाले प्रतिफल से आँका जाता है।'
      ),
      points: [
        {
          title: t('A portfolio chosen for Bihar', 'बिहार के लिए चुना गया पोर्टफोलियो'),
          body: t(
            'Continue adding OEMs whose engineering genuinely suits the soils, holding sizes, and cropping patterns of this region.',
            'ऐसे OEM जोड़ते रहना जिनकी इंजीनियरिंग इस क्षेत्र की मिट्टी, जोत के आकार और फसल पद्धति के लिए वास्तव में उपयुक्त हो।'
          ),
        },
        {
          title: t('Service within reach', 'सेवा पहुँच के भीतर'),
          body: t(
            'Extend trained service coverage deeper into the districts we serve, so downtime is measured in hours rather than weeks.',
            'हम जिन ज़िलों में सेवा देते हैं वहाँ प्रशिक्षित सेवा पहुँच को और गहरा करना, ताकि मशीन का बंद रहना हफ़्तों में नहीं, घंटों में मापा जाए।'
          ),
        },
        {
          title: t('Mechanisation that pays back', 'ऐसा यंत्रीकरण जो लौटाए'),
          body: t(
            'Support every buyer to the point where the machine has earned back more than it cost — season after season.',
            'हर खरीदार का साथ वहाँ तक देना जहाँ मशीन अपनी लागत से अधिक कमा चुकी हो — मौसम दर मौसम।'
          ),
        },
      ],
    },
  ];

  const leadership = [
    {
      name: t('Anurag Vasista', 'अनुराग वशिष्ठ'),
      role: t('Director', 'निदेशक'),
      image: '/anurag_vasista.png',
      alt: 'Anurag Vasista, Director of Shyamali Krishna Automobile Private Limited',
      bio: t(
        "Anurag Vasista directs the company's OEM relationships and commercial strategy — deciding which manufacturers earn a place in the Shyamali Krishna portfolio, and on what terms. His priority is keeping the dealership genuinely multi-brand: each implement is judged on build quality, suitability to Bihar's soils and holding sizes, and the manufacturer's ability to sustain parts and service support over the long term. He works directly with buyers on larger and institutional purchases, where selection has to be reasoned against tractor horsepower, crop rotation, and operating scale rather than brand preference.",
        'अनुराग वशिष्ठ कंपनी के OEM संबंधों और व्यावसायिक रणनीति का नेतृत्व करते हैं — यह तय करते हैं कि कौन से निर्माता श्यामली कृष्णा के पोर्टफोलियो में स्थान पाने योग्य हैं और किन शर्तों पर। उनकी प्राथमिकता डीलरशिप को वास्तव में मल्टी-ब्रांड बनाए रखना है: हर उपकरण को निर्माण गुणवत्ता, बिहार की मिट्टी व जोत के आकार के अनुकूलता, और निर्माता की दीर्घकालिक पुर्ज़ा एवं सेवा सहायता क्षमता पर परखा जाता है। बड़ी और संस्थागत खरीद में वे स्वयं खरीदारों के साथ काम करते हैं, जहाँ चयन ब्रांड की पसंद से नहीं बल्कि ट्रैक्टर की शक्ति, फसल चक्र और परिचालन पैमाने के आधार पर तय होता है।'
      ),
    },
    {
      name: t('Guriya Kumari', 'गुड़िया कुमारी'),
      role: t('Director', 'निदेशक'),
      image: '/guriya_kumari.png',
      alt: 'Guriya Kumari, Director of Shyamali Krishna Automobile Private Limited',
      bio: t(
        'Guriya Kumari oversees the operational side of the business — purchase documentation, delivery coordination, and the subsidy and finance assistance that accompanies most machinery purchases. She leads the team that helps farmers identify which government schemes apply to them, assemble the paperwork correctly, and coordinate with financing channels, so that no buyer is left to navigate that process alone. Her remit also covers customer records and after-sales follow-up, ensuring every machine sold remains traceable to the service and genuine-parts support it is entitled to.',
        'गुड़िया कुमारी व्यवसाय के परिचालन पक्ष की देखरेख करती हैं — खरीद प्रलेखन, डिलीवरी समन्वय, और अधिकांश मशीनरी खरीद के साथ जुड़ी सब्सिडी एवं वित्त सहायता। वे उस टीम का नेतृत्व करती हैं जो किसानों को यह पहचानने में मदद करती है कि कौन सी सरकारी योजनाएँ उन पर लागू होती हैं, कागज़ात सही ढंग से तैयार कराती है, और वित्तपोषण माध्यमों से समन्वय करती है — ताकि किसी भी खरीदार को यह प्रक्रिया अकेले न निभानी पड़े। ग्राहक अभिलेख और बिक्री-पश्चात अनुवर्ती कार्य भी उनके दायित्व में हैं, जिससे बेची गई हर मशीन उसे मिलने वाली सेवा और असली पुर्ज़ों की सहायता से जुड़ी रहे।'
      ),
    },
    {
      name: t('K. M. Sharma', 'के. एम. शर्मा'),
      role: t('Shareholder', 'शेयरधारक'),
      image: '/km_sharma.png',
      alt: 'K. M. Sharma, Shareholder of Shyamali Krishna Automobile Private Limited',
      bio: t(
        'K. M. Sharma is a shareholder in Shyamali Krishna Automobile Private Limited and a long-standing voice in its governance. He contributes at the level of strategy and standards — how the company grows, which markets it enters next, and the commercial discipline it holds itself to as the portfolio and service footprint expand. His involvement is deliberately long term in orientation: building a dealership whose standing in the region rests on consistency and accountability rather than on the results of any single season.',
        'के. एम. शर्मा श्यामली कृष्णा ऑटोमोबाइल प्राइवेट लिमिटेड के शेयरधारक हैं और कंपनी के संचालन-तंत्र में एक दीर्घकालिक स्वर रहे हैं। उनका योगदान रणनीति और मानकों के स्तर पर है — कंपनी किस दिशा में बढ़े, अगला कौन सा बाज़ार चुने, और पोर्टफोलियो व सेवा दायरे के विस्तार के साथ किस व्यावसायिक अनुशासन का पालन करे। उनकी भागीदारी सोच-समझकर दीर्घकालिक दृष्टि से जुड़ी है: ऐसी डीलरशिप बनाना जिसकी क्षेत्रीय प्रतिष्ठा किसी एक मौसम के परिणामों पर नहीं, बल्कि निरंतरता और जवाबदेही पर टिकी हो।'
      ),
    },
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

      {/* Mission and Vision */}
      <section id="mission-vision" className="section-padding bg-bone-50 border-y border-bone-300">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              center
              eyebrow={t('Purpose', 'उद्देश्य')}
              title={t('Mission & Vision', 'मिशन और विज़न')}
              subtitle={t(
                'What we commit to on every sale, and the standard we are building the business toward.',
                'हर बिक्री पर हमारी प्रतिबद्धता क्या है, और हम व्यवसाय को किस मानक की ओर ले जा रहे हैं।'
              )}
            />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {purposeBlocks.map((block, index) => (
              <Reveal key={index} delay={index * 100}>
                <div className="h-full bg-white border-x border-b border-bone-300 border-t-2 border-t-gold p-8 lg:p-10 flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 flex items-center justify-center w-11 h-11 bg-gold-50">
                      {block.icon}
                    </div>
                    <span className="text-xs font-medium tracking-[0.15em] uppercase text-gold">
                      {block.eyebrow}
                    </span>
                  </div>

                  <p className="heading-serif text-xl md:text-2xl text-charcoal leading-snug mt-6">
                    {block.statement}
                  </p>

                  <ul className="mt-8 pt-8 border-t border-bone-300 space-y-5">
                    {block.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex gap-3">
                        <Check className="w-4 h-4 text-gold shrink-0 mt-1" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium text-charcoal">{point.title}</p>
                          <p className="text-sm text-stone leading-relaxed mt-1">{point.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section id="leadership" className="section-padding">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              center
              eyebrow={t('Leadership & Ownership', 'नेतृत्व और स्वामित्व')}
              title={t('The People Behind the Company', 'कंपनी के पीछे के लोग')}
              subtitle={t(
                'Shyamali Krishna Automobile Private Limited is directed and owned by people who are accountable for every recommendation the dealership makes.',
                'श्यामली कृष्णा ऑटोमोबाइल प्राइवेट लिमिटेड का संचालन और स्वामित्व उन लोगों के हाथ में है जो डीलरशिप की हर सिफ़ारिश के लिए जवाबदेह हैं।'
              )}
            />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {leadership.map((person, index) => (
              <Reveal key={index} delay={index * 100}>
                <article className="group h-full bg-white border border-bone-300 flex flex-col">
                  {/* Portraits are transparent cut-outs, so the tinted panel behind
                      them supplies the backdrop rather than the photograph itself. */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-bone-100 via-bone-200 to-bone-300">
                    <img
                      src={person.image}
                      alt={person.alt}
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="border-t-2 border-gold p-6 flex flex-col grow">
                    <h3 className="heading-serif text-xl text-charcoal">{person.name}</h3>
                    <p className="text-xs font-medium tracking-[0.15em] uppercase text-gold mt-1.5">
                      {person.role}
                    </p>
                    <p className="text-sm text-stone leading-relaxed mt-4">{person.bio}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-charcoal text-ivory py-16 lg:py-20">
        <div className="container-site">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="heading-serif text-2xl md:text-3xl text-ivory mb-4">
                {t('Ready to find the right implement?', 'सही उपकरण खोजने के लिए तैयार?')}
              </h2>
              <p className="text-ivory/70 leading-relaxed mb-8">
                {t(
                  'Tell us your soil, crop cycle, and tractor horsepower — we will recommend what actually fits.',
                  'हमें अपनी मिट्टी, फसल चक्र और ट्रैक्टर की शक्ति बताइए — हम वही सुझाएँगे जो वास्तव में उपयुक्त हो।'
                )}
              </p>
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
      </section>
    </div>
  );
}
