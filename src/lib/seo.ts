'use client';

import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  structuredData?: object | object[];
  hreflang?: boolean;
}

const SITE_URL = 'https://www.shyamalikrishna.com';
const SITE_NAME = 'Shyamali Krishna Automobile Private Limited';

export function useSEO(options: SEOOptions) {
  const {
    title,
    description,
    canonical,
    ogType = 'website',
    ogImage,
    structuredData,
    hreflang = true,
  } = options;

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', ogType, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');
    setMeta('og:url', canonical || window.location.href, 'property');
    if (ogImage) setMeta('og:image', ogImage, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    if (ogImage) setMeta('twitter:image', ogImage);

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonical || window.location.href;

    // Hreflang
    if (hreflang) {
      const existing = document.querySelectorAll('link[rel="alternate"][hreflang]');
      existing.forEach((el) => el.remove());
      const path = canonical ? new URL(canonical).pathname : window.location.pathname;
      const enLink = document.createElement('link');
      enLink.rel = 'alternate';
      enLink.hreflang = 'en';
      enLink.href = `${SITE_URL}/en${path}`;
      document.head.appendChild(enLink);

      const hiLink = document.createElement('link');
      hiLink.rel = 'alternate';
      hiLink.hreflang = 'hi';
      hiLink.href = `${SITE_URL}/hi${path}`;
      document.head.appendChild(hiLink);

      const defaultLink = document.createElement('link');
      defaultLink.rel = 'alternate';
      defaultLink.hreflang = 'x-default';
      defaultLink.href = `${SITE_URL}${path}`;
      document.head.appendChild(defaultLink);
    }

    // Structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"].seo-dynamic');
    existingScripts.forEach((el) => el.remove());

    if (structuredData) {
      const data = Array.isArray(structuredData) ? structuredData : [structuredData];
      data.forEach((item) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.classList.add('seo-dynamic');
        script.textContent = JSON.stringify(item);
        document.head.appendChild(script);
      });
    }
  }, [title, description, canonical, ogType, ogImage, structuredData, hreflang]);
}

export { SITE_URL, SITE_NAME };
