'use client';

import { useSEO } from '@/lib/seo';
import { PageHero } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/States';
import { useLang } from '@/lib/i18n';

export function LeadershipPage() {
  const { t } = useLang();

  useSEO({
    title: 'Leadership — Shyamali Krishna Automobile',
    description: 'The leadership team at Shyamali Krishna Automobile Private Limited.',
    canonical: 'https://www.shyamalikrishna.com/about/leadership',
  });

  return (
    <div>
      <PageHero
        eyebrow={t('About', 'हमारे बारे में')}
        title={t('Leadership', 'नेतृत्व')}
        subtitle={t(
          'The team guiding Shyamali Krishna Automobile.',
          'श्यामली कृष्णा ऑटोमोबाइल का मार्गदर्शन करने वाली टीम।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Leadership' }]} />}
      />
      <section className="section-padding">
        <div className="container-site">
          <EmptyState
            title={t('Leadership details to be updated', 'नेतृत्व विवरण अद्यतन किया जाएगा')}
            message={t(
              'Leadership information is managed through our internal content system. Please check back soon or contact us directly for information about our team.',
              'नेतृत्व की जानकारी हमारे आंतरिक सामग्री प्रणाली के माध्यम से प्रबंधित की जाती है। कृपया जल्द ही वापस जांचें या हमारी टीम के बारे में जानकारी के लिए सीधे संपर्क करें।'
            )}
          />
        </div>
      </section>
    </div>
  );
}
