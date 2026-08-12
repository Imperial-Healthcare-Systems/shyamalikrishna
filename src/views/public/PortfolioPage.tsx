'use client';
import type { Category, Partner, Product } from '@/lib/types';

import Link from 'next/link';
import { ArrowRight, Shovel, Sprout, Leaf, Wheat, Package, Wrench } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useCategories, useProducts, usePartners } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductCard } from '@/components/products/ProductCard';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { useLang } from '@/lib/i18n';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'tillage-soil-preparation': <Shovel className="w-6 h-6" />,
  'sowing-seeding': <Sprout className="w-6 h-6" />,
  'residue-management': <Leaf className="w-6 h-6" />,
  'harvesting': <Wheat className="w-6 h-6" />,
  'post-harvest': <Package className="w-6 h-6" />,
  'specialist-implements': <Wrench className="w-6 h-6" />,
};

interface PortfolioPageProps {
  initialCategories?: Category[];
  initialPartners?: Partner[];
  initialProducts?: Product[];
}

export function PortfolioPage({ initialCategories, initialPartners, initialProducts }: PortfolioPageProps = {}) {
  const { t } = useLang();
  const { data: categories, loading: catLoading } = useCategories(initialCategories);
  const { data: products, loading: prodLoading } = useProducts(undefined, initialProducts);
  const { data: partners } = usePartners(initialPartners);

  useSEO({
    title: 'Product Portfolio — Agricultural Machinery',
    description: 'Browse our full portfolio of agricultural machinery — rotavators, seeders, Happy Seeders, straw reapers, threshers, cultivators, harvesters, and specialist implements from Maschio Gaspardo, Sitara AgroTech, Govind, Agrimax, and Hazarix.',
    canonical: 'https://www.shyamalikrishna.com/portfolio',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Product Portfolio',
      url: 'https://www.shyamalikrishna.com/portfolio',
    },
  });

  if (catLoading || prodLoading) {
    return (
      <div>
        <PageHero title={t('Product Portfolio', 'उत्पाद पोर्टफोलियो')} />
        <LoadingSpinner label={t('Loading products…', 'उत्पाद लोड हो रहे हैं…')} />
      </div>
    );
  }

  return (
    <div>
      <PageHero
        eyebrow={t('Portfolio', 'पोर्टफोलियो')}
        title={t('Product Portfolio', 'उत्पाद पोर्टफोलियो')}
        subtitle={t(
          'Six stages of farm mechanization, one multi-OEM portfolio. Browse by category or explore by brand.',
          'खेत यांत्रिकीकरण के छह चरण, एक मल्टी-OEM पोर्टफोलियो। श्रेणी के अनुसार ब्राउज़ करें या ब्रांड के अनुसार देखें।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'Portfolio', href: '/portfolio' }]} />}
        image="/category-sowing.webp"
        imageAlt="Agricultural implements across the six stages of farm mechanization"
      />

      {/* Categories overview */}
      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-bone-300 border border-bone-300">
            {(categories || []).map((cat, index) => {
              const catProducts = (products || []).filter(p => p.category_id === cat.id);
              return (
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
                      <p className="text-sm text-stone line-clamp-2 flex-1 mb-3">
                        {t(cat.short_description, cat.short_description_hi || cat.short_description)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-stone">
                        {catProducts.length} {t('products', 'उत्पाद')}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          {/* All products */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="heading-serif text-2xl text-charcoal">{t('All Products', 'सभी उत्पाद')}</h2>
              {(partners || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(partners || []).map(p => (
                    <Link
                      key={p.id}
                      href={`/partners/${p.slug}`}
                      className="badge bg-bone text-charcoal hover:bg-gold hover:text-white transition-colors"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {(products || []).length === 0 ? (
              <EmptyState
                title={t('No products available', 'कोई उत्पाद उपलब्ध नहीं')}
                message={t('No machinery is currently listed. Please check back soon.', 'वर्तमान में कोई मशीनरी सूचीबद्ध नहीं है। कृपया जल्द ही वापस जांचें।')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(products || []).map((product, index) => (
                  <Reveal key={product.id} delay={index * 50}>
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
