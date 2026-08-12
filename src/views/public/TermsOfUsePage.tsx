'use client';
import type { SiteSettings } from '@/lib/types';

import { useSEO } from '@/lib/seo';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useSiteSettings } from '@/lib/hooks';

interface TermsOfUsePageProps {
  initialSettings?: SiteSettings;
}

export function TermsOfUsePage({ initialSettings }: TermsOfUsePageProps = {}) {
  const { data: settings } = useSiteSettings(initialSettings);

  useSEO({
    title: 'Terms of Use',
    description: 'Terms of use for the Shyamali Krishna Automobile website.',
    canonical: 'https://www.shyamalikrishna.com/terms-of-use',
  });

  return (
    <div>
      <PageHero title="Terms of Use" breadcrumb={<Breadcrumbs items={[{ label: 'Terms of Use' }]} />} />
      <section className="section-padding">
        <div className="container-site">
          <div className="max-w-3xl space-y-6 text-stone leading-relaxed">
            <p className="text-sm text-stone/60">Last updated: August 2026</p>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using this website, you accept and agree to be bound by these Terms of Use. If you do not agree, please do not use this website.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">2. Use of the Website</h2>
              <p>You agree to use this website for lawful purposes only. You must not:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>Misuse the enquiry or application forms to submit false or misleading information</li>
                <li>Attempt to gain unauthorized access to any part of the website</li>
                <li>Use automated tools to scrape, harvest, or collect data from the website</li>
                <li>Introduce viruses, malware, or other harmful code</li>
              </ul>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">3. Intellectual Property</h2>
              <p>All content on this website — including text, images, logos, product descriptions, and design — is the property of {settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'} or its licensors. You may not reproduce, distribute, or use this content without prior written permission.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">4. Product Information</h2>
              <p>We make every effort to ensure product information on this website is accurate. However, specifications, availability, and other details may change. We recommend contacting us to confirm current specifications before making a purchase decision.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">5. No Warranty</h2>
              <p>This website is provided "as is" without warranties of any kind. We do not guarantee that the website will be uninterrupted, error-free, or free of harmful components.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">6. Limitation of Liability</h2>
              <p>To the fullest extent permitted by law, {settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of this website.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">7. Third-Party Links</h2>
              <p>This website may contain links to third-party websites. We are not responsible for the content, privacy practices, or accuracy of these external sites.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">8. Changes to Terms</h2>
              <p>We may update these Terms of Use at any time. Continued use of the website after changes constitutes acceptance of the updated terms.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">9. Governing Law</h2>
              <p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Bihar, India.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">10. Contact</h2>
              <p className="text-sm">
                {settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'}<br />
                {settings?.office_line2}<br />
                {settings?.office_line3}<br />
                Email: {settings?.email || 'info@shyamalikrishna.com'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
