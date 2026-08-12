'use client';
import type { Product, SiteSettings } from '@/lib/types';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Phone, MessageCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useProduct, useProducts, useSiteSettings } from '@/lib/hooks';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductCard } from '@/components/products/ProductCard';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { Reveal } from '@/components/ui/Reveal';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';
import { telLink, whatsappLink } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface ProductDetailPageProps {
  initialProduct?: Product | null;
  initialProducts?: Product[];
  initialSettings?: SiteSettings;
}

export function ProductDetailPage({ initialProduct, initialProducts, initialSettings }: ProductDetailPageProps = {}) {
  const { categorySlug, productSlug } = useParams<{ categorySlug: string; productSlug: string }>();
  const { t } = useLang();
  const { data: product, loading, error } = useProduct(productSlug, initialProduct);
  const { data: allProducts } = useProducts(undefined, initialProducts);
  const { data: settings } = useSiteSettings(initialSettings);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const phone = settings?.phone || '+91 7488095803';
  const whatsapp = settings?.whatsapp || phone;

  useSEO({
    title: product ? `${product.name} — ${product.partner?.name || 'Agricultural Machinery'}` : 'Product',
    description: product?.seo_description || product?.positioning || 'Agricultural machinery product details.',
    canonical: `https://www.shyamalikrishna.com/portfolio/${categorySlug}/${productSlug}`,
    ogType: 'product',
    structuredData: product ? [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.positioning || product.overview || '',
        brand: product.partner ? { '@type': 'Brand', name: product.partner.name } : undefined,
        category: product.category?.name,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.shyamalikrishna.com' },
          { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://www.shyamalikrishna.com/portfolio' },
          { '@type': 'ListItem', position: 3, name: product.category?.name || 'Category', item: `https://www.shyamalikrishna.com/portfolio/${product.category?.slug}` },
          { '@type': 'ListItem', position: 4, name: product.name, item: `https://www.shyamalikrishna.com/portfolio/${product.category?.slug}/${product.slug}` },
        ],
      },
    ] : undefined,
  });

  if (loading) {
    return (
      <div className="container-site py-8">
        <LoadingSpinner label={t('Loading product…', 'उत्पाद लोड हो रहा है…')} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-site py-8">
        <Breadcrumbs items={[
          { label: 'Portfolio', href: '/portfolio' },
          { label: 'Product Not Found' },
        ]} />
        <ErrorState message={t('This product could not be found.', 'यह उत्पाद नहीं मिल सका।')} />
      </div>
    );
  }

  // Build specs list from non-null fields
  const specs: { label: string; value: string }[] = [];
  if (product.tractor_hp) specs.push({ label: t('Tractor HP', 'ट्रैक्टर HP'), value: product.tractor_hp });
  if (product.working_width) specs.push({ label: t('Working Width', 'कार्य चौड़ाई'), value: product.working_width });
  if (product.weight) specs.push({ label: t('Weight', 'वज़न'), value: product.weight });
  if (product.blade_tine_config) specs.push({ label: t('Blade / Tine Configuration', 'ब्लेड / टाइन विन्यास'), value: product.blade_tine_config });
  if (product.gearbox_drive) specs.push({ label: t('Gearbox / Drive', 'गियरबॉक्स / ड्राइव'), value: product.gearbox_drive });
  if (product.rpm) specs.push({ label: 'RPM', value: product.rpm });
  if (product.warranty) specs.push({ label: t('Warranty', 'वारंटी'), value: product.warranty });

  const relatedProducts = (allProducts || [])
    .filter(p => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 3);

  const whatsappMsg = `Hello, I am interested in the ${product.name}${product.partner ? ` from ${product.partner.name}` : ''}. Could you please provide more information?`;

  return (
    <div>
      {/* Hero section */}
      <section className="bg-charcoal text-ivory py-12 lg:py-16">
        <div className="container-site">
          <Breadcrumbs items={[
            { label: 'Portfolio', href: '/portfolio' },
            { label: product.category?.name || 'Category', href: `/portfolio/${product.category?.slug}` },
            { label: product.name },
          ]} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-8">
            <div>
              {product.partner && (
                <Link
                  href={`/partners/${product.partner.slug}`}
                  className="inline-flex items-center gap-2 badge bg-gold/20 text-gold-300 mb-4 hover:bg-gold/30 transition-colors"
                >
                  {product.partner.name}
                  {product.partner.origin_country && <span className="text-gold-300/60">· {product.partner.origin_country}</span>}
                </Link>
              )}
              <h1 className="heading-serif text-3xl md:text-4xl lg:text-5xl text-ivory text-balance mb-4">
                {t(product.name, product.name_hi || product.name)}
              </h1>
              {product.positioning && (
                <p className="text-lg text-ivory/80 leading-relaxed max-w-xl mb-6">
                  {t(product.positioning, product.positioning_hi || product.positioning)}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setEnquiryOpen(true)} className="btn-gold">
                  {t('Enquire Now', 'अभी पूछताछ करें')}
                </button>
                <a href={telLink(phone)} className="btn-outline border-ivory/30 text-ivory hover:bg-ivory hover:text-charcoal">
                  <Phone className="w-4 h-4" /> {t('Call', 'कॉल')}
                </a>
                <a href={whatsappLink(whatsapp, whatsappMsg)} target="_blank" rel="noopener noreferrer" className="btn-field">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
            <div className="aspect-[4/3] bg-charcoal-700 overflow-hidden">
              {product.primary_image_url ? (
                <img
                  src={product.primary_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  width={600}
                  height={450}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="heading-serif text-7xl text-ivory/10">
                    {product.partner?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Specifications */}
      {specs.length > 0 && (
        <section className="bg-bone py-12">
          <div className="container-site">
            <h2 className="heading-serif text-2xl text-charcoal mb-6">{t('Specifications', 'विशेषताएं')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-bone-300 border border-bone-300">
              {specs.map((spec, index) => (
                <div key={index} className="bg-white p-4">
                  <dt className="text-xs text-stone tracking-wide uppercase mb-1">{spec.label}</dt>
                  <dd className="text-charcoal font-medium">{spec.value}</dd>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Detailed content */}
      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-8">
              {product.overview && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('Product Overview', 'उत्पाद अवलोकन')}</h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">
                      {t(product.overview, product.overview_hi || product.overview)}
                    </p>
                  </div>
                </Reveal>
              )}

              {product.features && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('Features', 'विशेषताएं')}</h2>
                    <ul className="space-y-2">
                      {product.features.split(';').map((feature, index) => (
                        feature.trim() && (
                          <li key={index} className="flex items-start gap-2 text-stone">
                            <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                            <span>{feature.trim()}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {product.benefits && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('Benefits', 'लाभ')}</h2>
                    <ul className="space-y-2">
                      {product.benefits.split(';').map((benefit, index) => (
                        benefit.trim() && (
                          <li key={index} className="flex items-start gap-2 text-stone">
                            <CheckCircle2 className="w-5 h-5 text-field shrink-0 mt-0.5" />
                            <span>{benefit.trim()}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {product.applications && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('Applications & Use Cases', 'अनुप्रयोग और उपयोग')}</h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">
                      {t(product.applications, product.applications_hi || product.applications)}
                    </p>
                  </div>
                </Reveal>
              )}

              {product.crops && (
                <Reveal>
                  <div>
                    <h3 className="text-sm font-medium text-gold tracking-wide uppercase mb-2">{t('Suitable Crops', 'उपयुक्त फसलें')}</h3>
                    <p className="text-stone">{product.crops}</p>
                  </div>
                </Reveal>
              )}

              {product.warranty && (
                <Reveal>
                  <div className="p-6 bg-bone border-l-4 border-gold">
                    <h2 className="heading-serif text-xl text-charcoal mb-2">{t('Warranty & After-Sales', 'वारंटी और बिक्री के बाद')}</h2>
                    <p className="text-stone">{product.warranty}</p>
                  </div>
                </Reveal>
              )}

              {(product.financing || product.subsidy) && (
                <Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.financing && (
                      <div className="p-6 border border-bone-300">
                        <h3 className="text-sm font-medium text-gold tracking-wide uppercase mb-2">{t('Financing', 'वित्त')}</h3>
                        <p className="text-sm text-stone">{t(product.financing, product.financing_hi || product.financing)}</p>
                      </div>
                    )}
                    {product.subsidy && (
                      <div className="p-6 border border-bone-300">
                        <h3 className="text-sm font-medium text-gold tracking-wide uppercase mb-2">{t('Subsidy', 'सब्सिडी')}</h3>
                        <p className="text-sm text-stone">{t(product.subsidy, product.subsidy_hi || product.subsidy)}</p>
                      </div>
                    )}
                  </div>
                </Reveal>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-bone-300 p-6 sticky top-24">
                <h3 className="heading-serif text-lg text-charcoal mb-4">{t('Product Enquiry', 'उत्पाद पूछताछ')}</h3>
                <p className="text-sm text-stone mb-4">
                  {t(
                    'Interested in this implement? Send us your details and we will get back to you within one business day.',
                    'इस उपकरण में रुचि? अपना विवरण भेजें और हम एक कार्य दिवस के भीतर संपर्क करेंगे।'
                  )}
                </p>
                <EnquiryForm
                  sourcePage={`product:${product.slug}`}
                  productId={product.id}
                  productName={product.name}
                  partnerName={product.partner?.name}
                  compact
                />
              </div>
            </aside>
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-serif text-2xl text-charcoal">{t('Related Products', 'संबंधित उत्पाद')}</h2>
                {product.category && (
                  <Link href={`/portfolio/${product.category.slug}`} className="text-sm font-medium text-gold hover:text-gold-600 transition-colors flex items-center gap-1">
                    {t('View all in category', 'श्रेणी में सभी देखें')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((rp, index) => (
                  <Reveal key={rp.id} delay={index * 50}>
                    <ProductCard product={rp} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Enquiry modal */}
      <Modal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} title={t('Enquire about this product', 'इस उत्पाद के बारे में पूछताछ करें')} size="md">
        <EnquiryForm
          sourcePage={`product_modal:${product.slug}`}
          productId={product.id}
          productName={product.name}
          partnerName={product.partner?.name}
        />
      </Modal>
    </div>
  );
}
