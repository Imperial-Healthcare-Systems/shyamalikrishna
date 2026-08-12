'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  light?: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  light = false,
  actionLabel,
  actionHref,
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-col gap-4 ${center ? 'items-center text-center' : ''} ${actionLabel ? 'lg:flex-row lg:items-end lg:justify-between' : ''}`}>
      <div className={`flex flex-col gap-3 ${center ? 'items-center' : ''} ${actionLabel ? 'lg:max-w-2xl' : ''}`}>
        {eyebrow && (
          <span className={`text-xs font-medium tracking-[0.15em] uppercase ${light ? 'text-gold-300' : 'text-gold'}`}>
            {eyebrow}
          </span>
        )}
        <h2 className={`heading-serif text-3xl md:text-4xl ${light ? 'text-ivory' : 'text-charcoal'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-base md:text-lg ${light ? 'text-ivory/80' : 'text-stone'} leading-relaxed`}>
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-outline whitespace-nowrap shrink-0">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  breadcrumb?: ReactNode;
  /** Optional background photo. Falls back to flat charcoal when absent. */
  image?: string | null;
  imageAlt?: string;
}

export function PageHero({ eyebrow, title, subtitle, children, breadcrumb, image, imageAlt }: PageHeroProps) {
  return (
    <section className="relative bg-charcoal text-ivory py-16 lg:py-24 overflow-hidden">
      {image && (
        <div className="absolute inset-0">
          <img
            src={image}
            alt={imageAlt || ''}
            aria-hidden={imageAlt ? undefined : true}
            className="w-full h-full object-cover opacity-40"
            loading="eager"
            decoding="async"
          />
          {/* Keeps headline contrast on top of the photo at every breakpoint. */}
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/40" />
        </div>
      )}
      <div className="relative container-site">
        {breadcrumb}
        <div className="max-w-3xl mt-4">
          {eyebrow && (
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-gold-300 mb-4 block">
              {eyebrow}
            </span>
          )}
          <h1 className="heading-serif text-4xl md:text-5xl lg:text-6xl text-ivory text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 text-lg text-ivory/80 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}
