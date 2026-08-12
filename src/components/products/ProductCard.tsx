'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useLang } from '@/lib/i18n';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useLang();
  const categorySlug = product.category?.slug || '';
  const productSlug = product.slug;

  return (
    <Link
      href={`/portfolio/${categorySlug}/${productSlug}`}
      className="group flex flex-col bg-white border border-bone-300 hover:border-gold transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-bone overflow-hidden relative">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={t(product.name, product.name_hi || product.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            width={400}
            height={300}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bone-200">
            <span className="heading-serif text-4xl text-bone-400">
              {product.partner?.name?.charAt(0) || 'S'}
            </span>
          </div>
        )}
        {product.partner && (
          <div className="absolute top-3 left-3 badge bg-white/90 text-charcoal backdrop-blur-sm">
            {product.partner.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs text-gold font-medium tracking-wide uppercase mb-2">
            {t(product.category.name, product.category.name_hi || product.category.name)}
          </span>
        )}
        <h3 className="heading-serif text-lg text-charcoal group-hover:text-gold transition-colors mb-2">
          {t(product.name, product.name_hi || product.name)}
        </h3>
        {product.positioning && (
          <p className="text-sm text-stone line-clamp-2 mb-3 flex-1">
            {t(product.positioning, product.positioning_hi || product.positioning)}
          </p>
        )}
        {product.tractor_hp && (
          <div className="flex items-center gap-2 text-xs text-stone mb-3">
            <span className="badge bg-bone text-charcoal">{product.tractor_hp}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm font-medium text-charcoal group-hover:text-gold transition-colors mt-auto">
          {t('View Details', 'विवरण देखें')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
