'use client';
import type { Category, Partner, Product } from '@/lib/types';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useCategory, useCategoryProducts, usePartners } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductCard } from '@/components/products/ProductCard';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/States';
import { useLang } from '@/lib/i18n';

interface CategoryPageProps {
  initialCategory?: Category | null;
  initialPartners?: Partner[];
  initialProducts?: Product[];
}

export function CategoryPage({ initialCategory, initialPartners, initialProducts }: CategoryPageProps = {}) {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { t } = useLang();
  const { data: category, loading, error } = useCategory(categorySlug, initialCategory);
  const { data: products, loading: prodLoading } = useCategoryProducts(category?.id, initialProducts);
  const { data: partners } = usePartners(initialPartners);

  useSEO({
    title: category ? `${category.name} — Agricultural Machinery` : 'Category',
    description: category?.seo_description || category?.description || 'Browse agricultural machinery in this category.',
    canonical: `https://www.shyamalikrishna.com/portfolio/${categorySlug}`,
    structuredData: category ? {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      url: `https://www.shyamalikrishna.com/portfolio/${category.slug}`,
    } : undefined,
  });

  if (loading || prodLoading) {
    return (
      <div>
        <PageHero title={t('Loading…', 'लोड हो रहा है…')} />
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div>
        <PageHero title={t('Category Not Found', 'श्रेणी नहीं मिली')} />
        <ErrorState message={t('This category could not be found.', 'यह श्रेणी नहीं मिल सकी।')} />
      </div>
    );
  }

  // Group products by partner
  const productsByPartner = (products || []).reduce((acc, product) => {
    const partnerName = product.partner?.name || 'Other';
    if (!acc[partnerName]) acc[partnerName] = [];
    acc[partnerName].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <div>
      <PageHero
        eyebrow={t('Category', 'श्रेणी')}
        title={t(category.name, category.name_hi || category.name)}
        subtitle={t(
          category.short_description || category.description || '',
          category.short_description_hi || category.description_hi || category.short_description || ''
        )}
        breadcrumb={
          <Breadcrumbs items={[
            { label: 'Portfolio', href: '/portfolio' },
            { label: category.name },
          ]} />
        }
        image={category.image_url}
        imageAlt={`${category.name} machinery working in the field`}
      />

      <section className="section-padding">
        <div className="container-site">
          {category.description && (
            <Reveal>
              <div className="max-w-3xl mb-12">
                <p className="text-stone leading-relaxed text-lg">
                  {t(category.description, category.description_hi || category.description)}
                </p>
              </div>
            </Reveal>
          )}

          {(products || []).length === 0 ? (
            <EmptyState
              title={t('No machinery in this category', 'इस श्रेणी में कोई मशीनरी नहीं')}
              message={t('No machinery is currently listed in this category. Please contact us for information about available options.', 'वर्तमान में इस श्रेणी में कोई मशीनरी सूचीबद्ध नहीं है। कृपया उपलब्ध विकल्पों के बारे में जानकारी के लिए संपर्क करें।')}
              actionLabel={t('Contact us', 'संपर्क करें')}
              actionHref="/contact"
            />
          ) : (
            <div className="space-y-12">
              {Object.entries(productsByPartner).map(([partnerName, partnerProducts]) => (
                <div key={partnerName}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="heading-serif text-xl text-charcoal">{partnerName}</h2>
                    {partners?.find(p => p.name === partnerName) && (
                      <Link
                        href={`/partners/${partners.find(p => p.name === partnerName)?.slug}`}
                        className="text-sm font-medium text-gold hover:text-gold-600 transition-colors flex items-center gap-1"
                      >
                        {t('View partner', 'पार्टनर देखें')}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {partnerProducts!.map((product, index) => (
                      <Reveal key={product.id} delay={index * 50}>
                        <ProductCard product={product} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
