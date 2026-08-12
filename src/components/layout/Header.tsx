'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, Phone, ChevronDown, Search, Globe,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useCategories, usePartners, useSiteSettings } from '@/lib/hooks';
import { telLink } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { CallbackForm } from '@/components/forms/CallbackForm';
import type { Category, Partner } from '@/lib/types';

export function Header() {
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: categories } = useCategories();
  const { data: partners } = usePartners();
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleMegaMenuEnter = () => {
    if (megaMenuTimer.current) clearTimeout(megaMenuTimer.current);
    setMegaMenuOpen(true);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimer.current = setTimeout(() => setMegaMenuOpen(false), 150);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/resources/machinery-guides?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navItems = [
    { label: t('Home', 'होम'), href: '/' },
    { label: t('About', 'हमारे बारे में'), href: '/about' },
    { label: t('Product Portfolio', 'उत्पाद पोर्टफोलियो'), href: '/portfolio', hasMega: true },
    { label: t('Our OEM Partners', 'हमारे OEM पार्टनर'), href: '/partners' },
    { label: t('Services', 'सेवाएं'), href: '/services' },
    { label: t('Resources', 'संसाधन'), href: '/resources' },
    { label: t('Careers', 'करियर'), href: '/careers' },
    { label: t('Contact', 'संपर्क'), href: '/contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-ivory transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        {/* Top utility bar */}
        <div className="bg-charcoal text-ivory/80 text-xs hidden lg:block">
          <div className="container-site flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <span>{settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'}</span>
              <span className="text-ivory/40">|</span>
              <span>Nawada, Bihar</span>
            </div>
            <div className="flex items-center gap-4">
              <a href={telLink(settings?.phone || '+91 7488095803')} className="hover:text-gold transition-colors flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                {settings?.phone || '+91 7488095803'}
              </a>
              <span className="text-ivory/40">|</span>
              <span>{settings?.hours_weekday || 'Mon–Sat: 9 AM–7 PM'}</span>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="border-b border-bone-300">
          <div className="container-site">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center shrink-0" aria-label="Shyamali Krishna Automobile — Home">
                <img
                  src="/logo.svg"
                  alt="Shyamali Krishna Automobile"
                  className="h-9 lg:h-12 w-auto"
                  width={1117}
                  height={456}
                  fetchPriority="high"
                />
              </Link>

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
                {navItems.map((item) => (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={item.hasMega ? handleMegaMenuEnter : undefined}
                    onMouseLeave={item.hasMega ? handleMegaMenuLeave : undefined}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:text-gold ${
                        pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                          ? 'text-gold'
                          : 'text-charcoal'
                      }`}
                    >
                      {item.label}
                      {item.hasMega && <ChevronDown className="w-3.5 h-3.5" />}
                    </Link>
                  </div>
                ))}
              </nav>

              {/* Utility actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 hover:bg-bone transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={t('Search', 'खोज')}
                >
                  <Search className="w-5 h-5 text-charcoal" />
                </button>

                <button
                  onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal hover:text-gold transition-colors min-h-[44px]"
                  aria-label={`Switch to ${lang === 'en' ? 'Hindi' : 'English'}`}
                >
                  <Globe className="w-4 h-4" />
                  <span>{lang === 'en' ? 'हिं' : 'EN'}</span>
                </button>

                <button
                  onClick={() => setCallbackOpen(true)}
                  className="hidden lg:inline-flex btn-gold text-sm"
                >
                  {t('Request Callback', 'कॉलबैक अनुरोध')}
                </button>

                <button
                  onClick={() => setMobileOpen(true)}
                  className="lg:hidden p-2 hover:bg-bone transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                >
                  <Menu className="w-6 h-6 text-charcoal" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mega menu */}
        {megaMenuOpen && (
          <div
            ref={megaMenuRef}
            className="absolute left-0 right-0 top-full bg-white shadow-xl border-t border-bone-300 hidden lg:block animate-fadeIn"
            onMouseEnter={handleMegaMenuEnter}
            onMouseLeave={handleMegaMenuLeave}
          >
            <div className="container-site py-8">
              <div className="grid grid-cols-12 gap-8">
                {/* Categories */}
                <div className="col-span-7">
                  <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold mb-4">
                    {t('Product Categories', 'उत्पाद श्रेणियाँ')}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {(categories || []).map((cat: Category) => (
                      <Link
                        key={cat.id}
                        href={`/portfolio/${cat.slug}`}
                        className="group flex flex-col py-2.5 border-b border-bone-200 hover:border-gold transition-colors"
                      >
                        <span className="text-sm font-medium text-charcoal group-hover:text-gold transition-colors">
                          {t(cat.name, cat.name_hi || cat.name)}
                        </span>
                        {cat.short_description && (
                          <span className="text-xs text-stone mt-0.5 line-clamp-1">
                            {t(cat.short_description, cat.short_description_hi || cat.short_description)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Partners */}
                <div className="col-span-5 border-l border-bone-200 pl-8">
                  <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold mb-4">
                    {t('OEM Partners', 'OEM पार्टनर')}
                  </h3>
                  <div className="space-y-1">
                    {(partners || []).map((partner: Partner) => (
                      <Link
                        key={partner.id}
                        href={`/partners/${partner.slug}`}
                        className="flex items-center justify-between py-2 px-3 hover:bg-bone transition-colors group"
                      >
                        <div>
                          <span className="text-sm font-medium text-charcoal group-hover:text-gold transition-colors">
                            {partner.name}
                          </span>
                          {partner.origin_country && (
                            <span className="text-xs text-stone ml-2">{partner.origin_country}</span>
                          )}
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-stone group-hover:text-gold transition-colors" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/portfolio"
                    className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-gold hover:text-gold-600 transition-colors"
                  >
                    {t('View all products', 'सभी उत्पाद देखें')}
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-charcoal/60 animate-fadeIn" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-ivory overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-bone-300">
              <span className="heading-serif text-lg text-charcoal">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 hover:bg-bone min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="p-4 space-y-1" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-3 px-3 text-base font-medium text-charcoal hover:bg-bone transition-colors min-h-[44px] flex items-center"
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile categories accordion */}
              <MobileCategoriesAccordion categories={categories || []} t={t} />

              <div className="pt-4 border-t border-bone-300 mt-4 space-y-3">
                <a
                  href={telLink(settings?.phone || '+91 7488095803')}
                  className="btn-outline w-full"
                >
                  <Phone className="w-4 h-4" />
                  {t('Call Us', 'कॉल करें')}
                </a>
                <button
                  onClick={() => { setCallbackOpen(true); setMobileOpen(false); }}
                  className="btn-gold w-full"
                >
                  {t('Request Callback', 'कॉलबैक अनुरोध')}
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Search modal */}
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title={t('Search', 'खोज')} size="md">
        <form onSubmit={handleSearch} className="space-y-4">
          <p className="text-sm text-stone">
            {t('Search products, OEMs, categories, and applications.', 'उत्पाद, OEM, श्रेणियाँ और अनुप्रयोग खोजें।')}
          </p>
          <div className="flex gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search machinery, brands, applications…', 'मशीनरी, ब्रांड, अनुप्रयोग खोजें…')}
              className="input-field"
              autoFocus
              aria-label="Search query"
            />
            <button type="submit" className="btn-primary shrink-0">
              <Search className="w-4 h-4" />
              {t('Search', 'खोज')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(categories || []).slice(0, 3).map((cat: Category) => (
              <Link
                key={cat.id}
                href={`/portfolio/${cat.slug}`}
                onClick={() => setSearchOpen(false)}
                className="badge bg-bone text-charcoal hover:bg-bone-300 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </form>
      </Modal>

      {/* Callback modal */}
      <Modal open={callbackOpen} onClose={() => setCallbackOpen(false)} title={t('Request a Callback', 'कॉलबैक अनुरोध करें')} size="sm">
        <CallbackForm sourcePage="header_callback_modal" />
      </Modal>
    </>
  );
}

function MobileCategoriesAccordion({ categories, t }: { categories: Category[]; t: (en: string, hi?: string) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-3 text-base font-medium text-charcoal hover:bg-bone transition-colors min-h-[44px]"
        aria-expanded={open}
      >
        {t('Product Categories', 'उत्पाद श्रेणियाँ')}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pl-4 space-y-1 animate-fadeIn">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/portfolio/${cat.slug}`}
              className="block py-2.5 px-3 text-sm text-stone hover:text-gold transition-colors min-h-[44px] flex items-center"
            >
              {t(cat.name, cat.name_hi || cat.name)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
