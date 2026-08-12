'use client';

import { useSEO } from '@/lib/seo';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/States';
import { useLang } from '@/lib/i18n';

export function LegacyPage() {
  const { t } = useLang();

  useSEO({
    title: 'Legacy & Milestones — Shyamali Krishna Automobile',
    description: 'The milestones and journey of Shyamali Krishna Automobile Private Limited.',
    canonical: 'https://www.shyamalikrishna.com/about/legacy',
  });

  return (
    <div>
      <PageHero
        eyebrow={t('About', 'हमारे बारे में')}
        title={t('Legacy & Milestones', 'विरासत और मील के पत्थर')}
        subtitle={t(
          'The milestones that have shaped our journey.',
          'मील के पत्थर जिन्होंने हमारी यात्रा को आकार दिया।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Legacy' }]} />}
        image="/regional-bihar-agriculture.webp"
        imageAlt="Aerial view of farmland and villages across the Bihar plains at sunrise"
      />
      <section className="section-padding">
        <div className="container-site">
          <EmptyState
            title={t('Milestones to be published', 'मील के पत्थर प्रकाशित किए जाएंगे')}
            message={t(
              'Verified milestones will be displayed here once entered through our content management system. We only publish confirmed historical information.',
              'सत्यापित मील के पत्थर यहां प्रदर्शित किए जाएंगे। हम केवल पुष्ट किए गए ऐतिहासिक जानकारी को प्रकाशित करते हैं।'
            )}
          />
        </div>
      </section>
    </div>
  );
}
