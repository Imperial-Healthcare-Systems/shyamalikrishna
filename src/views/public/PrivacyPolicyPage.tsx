'use client';
import type { SiteSettings } from '@/lib/types';

import { useSEO } from '@/lib/seo';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useSiteSettings } from '@/lib/hooks';

interface PrivacyPolicyPageProps {
  initialSettings?: SiteSettings;
}

export function PrivacyPolicyPage({ initialSettings }: PrivacyPolicyPageProps = {}) {
  const { data: settings } = useSiteSettings(initialSettings);

  useSEO({
    title: 'Privacy Policy',
    description: 'Privacy policy for Shyamali Krishna Automobile Private Limited — how we collect, use, and protect your personal information.',
    canonical: 'https://www.shyamalikrishna.com/privacy-policy',
  });

  return (
    <div>
      <PageHero
        title="Privacy Policy"
        breadcrumb={<Breadcrumbs items={[{ label: 'Privacy Policy' }]} />}
      />
      <section className="section-padding">
        <div className="container-site">
          <div className="max-w-3xl space-y-6 text-stone leading-relaxed">
            <p className="text-sm text-stone/60">Last updated: August 2026</p>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">1. Information We Collect</h2>
              <p>We collect information that you provide when you use our website, including:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>Contact details: name, phone number, WhatsApp number, email address, district/village</li>
                <li>Enquiry details: product interest, tractor horsepower, message content</li>
                <li>Application details: resume, qualifications, experience (for job applications)</li>
                <li>Technical data: pages visited, referring URLs, browser type (via standard server logs)</li>
              </ul>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">2. Purpose of Collection</h2>
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>Respond to your enquiries and callback requests</li>
                <li>Provide product information, consultations, and quotations</li>
                <li>Process job applications and communicate with candidates</li>
                <li>Coordinate financing and subsidy assistance</li>
                <li>Provide after-sales service and support</li>
                <li>Improve our website and services</li>
              </ul>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">3. Sharing of Information</h2>
              <p>
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>OEM partners for product-specific enquiries where necessary</li>
                <li>Financing partners when you request finance assistance</li>
                <li>Government authorities for subsidy scheme processing</li>
                <li>Service providers who help us operate our business (under confidentiality obligations)</li>
              </ul>
              <p className="mt-2 text-sm">We share only what is necessary for the stated purpose.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">4. Data Retention</h2>
              <p>
                We retain your information for as long as necessary to fulfil the purposes for which it was collected, including for record-keeping, warranty, and service purposes. Job application data is retained for a reasonable period for consideration against future openings.
              </p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>Request access to your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information (subject to legal obligations)</li>
                <li>Withdraw consent for processing</li>
                <li>Object to certain uses of your data</li>
              </ul>
              <p className="mt-2 text-sm">To exercise these rights, contact us at {settings?.email || 'info@shyamalikrishna.com'}.</p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">6. Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes secure storage, access controls, and encrypted transmission.
              </p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">7. Digital Personal Data Protection Act, 2023</h2>
              <p>
                This policy is aligned with the Digital Personal Data Protection Act, 2023 (DPDP Act) of India. We process your personal data in accordance with the principles of lawful, fair, and transparent processing, purpose limitation, data minimization, and storage limitation as set out in the Act.
              </p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">8. Cookies</h2>
              <p>
                Our website uses essential cookies for functionality. We do not use tracking cookies without your consent. Analytics cookies, if deployed, will be activated only with your explicit consent.
              </p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">9. Contact</h2>
              <p className="text-sm">
                For privacy-related queries, contact:<br />
                {settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'}<br />
                {settings?.office_line2}<br />
                {settings?.office_line3}<br />
                {settings?.office_line4}<br />
                Email: {settings?.email || 'info@shyamalikrishna.com'}<br />
                Phone: {settings?.phone || '+91 7488095803'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
