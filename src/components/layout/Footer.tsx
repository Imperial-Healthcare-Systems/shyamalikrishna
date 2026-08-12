'use client';

import Link from 'next/link';
import { Phone, Mail, MessageCircle, MapPin, Clock } from 'lucide-react';
import { useSiteSettings } from '@/lib/hooks';
import { telLink, whatsappLink } from '@/lib/utils';

export function Footer() {
  const { data: settings } = useSiteSettings();
  const year = new Date().getFullYear();

  const phone = settings?.phone || '+91 7488095803';
  const email = settings?.email || 'info@shyamalikrishna.com';
  const whatsapp = settings?.whatsapp || phone;

  return (
    <footer className="bg-charcoal text-ivory/70">
      {/* Main footer */}
      <div className="container-site py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <img
                src="/logo.svg"
                alt="Shyamali Krishna Automobile"
                className="h-12 w-auto"
                width={1117}
                height={456}
                loading="lazy"
              />
            </div>
            <p className="text-sm text-ivory/60 leading-relaxed">
              Authorized dealer and distributor of premium agricultural machinery across Bihar and adjoining regions.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span className="text-ivory/70">
                  {settings?.office_line1 && <>{settings.office_line1}<br /></>}
                  {settings?.office_line2 && <>{settings.office_line2}<br /></>}
                  {settings?.office_line3 && <>{settings.office_line3}<br /></>}
                  {settings?.office_line4}
                </span>
              </li>
              <li>
                <a href={telLink(phone)} className="flex items-center gap-2 hover:text-gold transition-colors">
                  <Phone className="w-4 h-4 text-gold shrink-0" />
                  {phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-gold transition-colors">
                  <Mail className="w-4 h-4 text-gold shrink-0" />
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(whatsapp, 'Hello, I would like to enquire about agricultural machinery.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-gold transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-gold shrink-0" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold mb-4">Navigate</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-gold transition-colors">About Us</Link></li>
              <li><Link href="/portfolio" className="hover:text-gold transition-colors">Product Portfolio</Link></li>
              <li><Link href="/partners" className="hover:text-gold transition-colors">OEM Partners</Link></li>
              <li><Link href="/services" className="hover:text-gold transition-colors">Services</Link></li>
              <li><Link href="/resources" className="hover:text-gold transition-colors">Resources</Link></li>
              <li><Link href="/careers" className="hover:text-gold transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal + hours */}
          <div>
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold mb-4">Information</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span className="text-ivory/70">
                  {settings?.hours_weekday || 'Mon–Sat: 9 AM–7 PM'}<br />
                  {settings?.hours_sunday || 'Sun: On appointment'}
                </span>
              </li>
              <li className="text-ivory/70">
                <span className="text-ivory/50">GST: </span>
                {settings?.gst || '10ABUCS4908F1ZA'}
              </li>
              <li><Link href="/privacy-policy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-use" className="hover:text-gold transition-colors">Terms of Use</Link></li>
              <li><Link href="/refund-cancellation" className="hover:text-gold transition-colors">Refund & Cancellation</Link></li>
              <li><Link href="/sitemap" className="hover:text-gold transition-colors">Sitemap</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ivory/10">
        <div className="container-site py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ivory/40">
          <p>© {year} {settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'}. All rights reserved.</p>
          <p>Built by <a href="https://imperial.tech" target="_blank" rel="noopener noreferrer" className="text-ivory/60 hover:text-gold transition-colors">Imperial</a></p>
        </div>
      </div>
    </footer>
  );
}
