'use client';
import type { Category, Job, Partner, Product, Resource, Service } from '@/lib/types';

import Link from 'next/link';
import { useSEO } from '@/lib/seo';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useCategories, usePartners, useProducts, useServices, useJobs, useResources } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/States';

interface SitemapPageProps {
  initialCategories?: Category[];
  initialJobs?: Job[];
  initialPartners?: Partner[];
  initialProducts?: Product[];
  initialResources?: Resource[];
  initialServices?: Service[];
}

export function SitemapPage({ initialCategories, initialJobs, initialPartners, initialProducts, initialResources, initialServices }: SitemapPageProps = {}) {
  useSEO({
    title: 'Sitemap',
    description: 'Complete sitemap of the Shyamali Krishna Automobile website.',
    canonical: 'https://www.shyamalikrishna.com/sitemap',
  });

  const { data: categories } = useCategories(initialCategories);
  const { data: partners } = usePartners(initialPartners);
  const { data: products } = useProducts(undefined, initialProducts);
  const { data: services } = useServices(initialServices);
  const { data: jobs } = useJobs(undefined, initialJobs);
  const { data: resources } = useResources(undefined, initialResources);

  const loading = !categories && !partners;

  if (loading) {
    return (
      <div>
        <PageHero title="Sitemap" />
        <LoadingSpinner />
      </div>
    );
  }

  const sections = [
    {
      title: 'Main Pages',
      links: [
        { label: 'Home', href: '/' },
        { label: 'About Us', href: '/about' },
        { label: 'Leadership', href: '/about/leadership' },
        { label: 'Legacy', href: '/about/legacy' },
        { label: 'Contact', href: '/contact' },
        { label: 'Enquire', href: '/enquire' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Product Portfolio',
      links: [
        { label: 'All Products', href: '/portfolio' },
        ...(categories || []).map(c => ({ label: c.name, href: `/portfolio/${c.slug}` })),
      ],
    },
    {
      title: 'OEM Partners',
      links: [
        { label: 'All Partners', href: '/partners' },
        ...(partners || []).map(p => ({ label: p.name, href: `/partners/${p.slug}` })),
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'All Services', href: '/services' },
        ...(services || []).map(s => ({ label: s.name, href: `/services/${s.slug}` })),
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'All Resources', href: '/resources' },
        { label: 'Machinery Selection Guides', href: '/resources/machinery-guides' },
        { label: 'Subsidy Schemes', href: '/resources/subsidy-schemes' },
        { label: 'FAQs', href: '/resources/faqs' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms of Use', href: '/terms-of-use' },
        { label: 'Refund & Cancellation', href: '/refund-cancellation' },
      ],
    },
  ];

  return (
    <div>
      <PageHero
        title="Sitemap"
        breadcrumb={<Breadcrumbs items={[{ label: 'Sitemap' }]} />}
      />
      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="heading-serif text-lg text-charcoal mb-3 border-b border-bone-300 pb-2">
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.href} className="text-sm text-stone hover:text-gold transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Products */}
          {(products || []).length > 0 && (
            <div className="mt-12">
              <h2 className="heading-serif text-lg text-charcoal mb-3 border-b border-bone-300 pb-2">All Products</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {(products || []).map(product => (
                  <li key={product.id}>
                    <Link
                      href={`/portfolio/${product.category?.slug}/${product.slug}`}
                      className="text-sm text-stone hover:text-gold transition-colors"
                    >
                      {product.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Jobs */}
          {(jobs || []).length > 0 && (
            <div className="mt-12">
              <h2 className="heading-serif text-lg text-charcoal mb-3 border-b border-bone-300 pb-2">Open Positions</h2>
              <ul className="space-y-2">
                {(jobs || []).map(job => (
                  <li key={job.id}>
                    <Link href={`/careers/${job.slug}`} className="text-sm text-stone hover:text-gold transition-colors">
                      {job.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
