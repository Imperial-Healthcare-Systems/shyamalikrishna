'use client';

import Link from 'next/link';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export function NotFoundPage() {
  useSEO({
    title: 'Page Not Found',
    description: 'The page you are looking for could not be found.',
    canonical: 'https://www.shyamalikrishna.com/404',
  });

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-ivory">
      <div className="container-site text-center">
        <Breadcrumbs items={[{ label: '404' }]} />
        <div className="mt-8">
          <h1 className="heading-serif text-6xl md:text-8xl text-charcoal mb-4">404</h1>
          <p className="text-xl text-stone mb-2">Page Not Found</p>
          <p className="text-sm text-stone/70 mb-8 max-w-md mx-auto">
            The page you are looking for may have been moved, removed, or never existed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">Return Home</Link>
            <Link href="/portfolio" className="btn-outline">Browse Products</Link>
            <Link href="/contact" className="btn-ghost">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
