'use client';
import type { Job } from '@/lib/types';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSEO } from '@/lib/seo';
import { useJob } from '@/lib/hooks';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { JobApplicationForm } from '@/components/forms/JobApplicationForm';
import { useLang } from '@/lib/i18n';

interface JobApplyPageProps {
  initialJob?: Job | null;
}

export function JobApplyPage({ initialJob }: JobApplyPageProps = {}) {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const { t } = useLang();
  const { data: job, loading, error } = useJob(jobSlug === 'general-application' ? undefined : jobSlug, initialJob);

  const isGeneral = jobSlug === 'general-application';

  useSEO({
    title: isGeneral ? 'General Application — Careers' : job ? `Apply: ${job.title}` : 'Apply',
    description: isGeneral
      ? 'Submit a general application for future opportunities at Shyamali Krishna Automobile.'
      : `Apply for ${job?.title || 'this position'} at Shyamali Krishna Automobile.`,
    canonical: `https://www.shyamalikrishna.com/careers/${jobSlug}/apply`,
  });

  if (!isGeneral && loading) {
    return (
      <div className="container-site py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isGeneral && (error || !job)) {
    return (
      <div className="container-site py-8">
        <Breadcrumbs items={[{ label: 'Careers', href: '/careers' }, { label: 'Not Found' }]} />
        <ErrorState message={t('This position could not be found.', 'यह पद नहीं मिल सका।')} />
      </div>
    );
  }

  return (
    <div>
      <section className="bg-charcoal text-ivory py-12">
        <div className="container-site">
          <Breadcrumbs items={[
            { label: 'Careers', href: '/careers' },
            { label: isGeneral ? 'General Application' : job?.title || 'Position', href: `/careers/${jobSlug}` },
            { label: 'Apply' },
          ]} />
          <h1 className="heading-serif text-3xl md:text-4xl text-ivory mt-4">
            {isGeneral ? t('General Application', 'सामान्य आवेदन') : t('Apply for this Position', 'इस पद के लिए आवेदन करें')}
          </h1>
          {!isGeneral && job?.title && (
            <p className="text-ivory/70 mt-2">{job.title}</p>
          )}
        </div>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-bone-300 p-6 lg:p-8">
              <JobApplicationForm
                jobId={isGeneral ? undefined : job?.id}
                jobSlug={isGeneral ? undefined : job?.slug}
                jobTitle={isGeneral ? undefined : job?.title}
                isGeneral={isGeneral}
              />
            </div>
            <p className="text-center text-sm text-stone mt-6">
              {t('Your information will be kept confidential and used only for recruitment purposes.', 'आपकी जानकारी गोपनीय रखी जाएगी और केवल भर्ती उद्देश्यों के लिए उपयोग की जाएगी।')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
