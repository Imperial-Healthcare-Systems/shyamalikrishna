'use client';
import type { SiteSettings } from '@/lib/types';

import { useSEO } from '@/lib/seo';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useSiteSettings } from '@/lib/hooks';

interface RefundCancellationPageProps {
  initialSettings?: SiteSettings;
}

export function RefundCancellationPage({ initialSettings }: RefundCancellationPageProps = {}) {
  const { data: settings } = useSiteSettings(initialSettings);

  useSEO({
    title: 'Refund & Cancellation Policy',
    description: 'Refund and cancellation policy for Shyamali Krishna Automobile Private Limited.',
    canonical: 'https://www.shyamalikrishna.com/refund-cancellation',
  });

  return (
    <div>
      <PageHero title="Refund & Cancellation Policy" breadcrumb={<Breadcrumbs items={[{ label: 'Refund & Cancellation' }]} />} />
      <section className="section-padding">
        <div className="container-site">
          <div className="max-w-3xl space-y-6 text-stone leading-relaxed">
            <p className="text-sm text-stone/60">Last updated: August 2026</p>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">1. Overview</h2>
              <p>
                {settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'} is a dealer and distributor of agricultural machinery. This policy outlines the terms under which cancellations and refunds may be processed for purchases made through our business.
              </p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">2. Order Cancellation</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Orders may be cancelled before dispatch at no charge. Please contact us as soon as possible.</li>
                <li>Once an order has been dispatched, cancellation is not possible. You may refuse delivery, and the matter will be handled as a return.</li>
                <li>Custom or special-order items may not be eligible for cancellation once the manufacturer has commenced production.</li>
              </ul>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">3. Returns</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Machinery may be returned within 7 days of delivery only if it is unused, in original packaging, and accompanied by proof of purchase.</li>
                <li>Returns are subject to inspection. Refunds will be processed only if the product meets return conditions.</li>
                <li>Transportation costs for returns are borne by the customer unless the return is due to a defect or error on our part.</li>
              </ul>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">4. Refund Processing</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Approved refunds will be processed within 15 business days of receipt and inspection of the returned product.</li>
                <li>Refunds will be made to the original payment method where possible.</li>
                <li>If payment was made by cheque or bank transfer, the refund will be made to the same account.</li>
              </ul>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">5. Defective Products</h2>
              <p>
                If you receive a product that is defective or damaged, please contact us within 48 hours of delivery. We will arrange inspection and repair, replacement, or refund as appropriate under the manufacturer's warranty terms.
              </p>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">6. Non-Refundable Items</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Products damaged due to misuse, improper installation, or negligence</li>
                <li>Products modified or repaired by unauthorized parties</li>
                <li>Consumable parts (blades, tines, belts) once used</li>
              </ul>
            </div>

            <div>
              <h2 className="heading-serif text-xl text-charcoal mb-3">7. Contact</h2>
              <p className="text-sm">
                For cancellation or refund requests, contact:<br />
                {settings?.legal_name || 'Shyamali Krishna Automobile Private Limited'}<br />
                {settings?.office_line2}<br />
                {settings?.office_line3}<br />
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
