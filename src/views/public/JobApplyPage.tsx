'use client';
import type { Job } from '@/lib/types';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useJob } from '@/lib/hooks';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { JobApplicationForm } from '@/components/forms/JobApplicationForm';
import { useLang } from '@/lib/i18n';
import { isJobOpen } from '@/lib/types';
import { locationNames } from '@/lib/careers';

interface JobApplyPageProps {
  initialJob?: Job | null;
}

export function JobApplyPage({ initialJob }: JobApplyPageProps = {}) {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const { t } = useLang();
  const isGeneral = jobSlug === 'general-application';
  const { data: job, loading, error } = useJob(isGeneral ? undefined : jobSlug, initialJob);

  useSEO({
    title: isGeneral
      ? 'General Application — Careers'
      : job
        ? `Apply: ${job.title} | Shyamali Krishna Automobile`
        : 'Apply',
    description: isGeneral
      ? 'Submit a general application for future opportunities at Shyamali Krishna Automobile.'
      : `Apply for the ${job?.title || 'open'} position at Shyamali Krishna Automobile Private Limited, Nawada, Bihar.`,
    canonical: `https://www.shyamalikrishna.com/careers/${jobSlug}/apply`,
  });

  if (!isGeneral && loading) {
    return (
      <div className="container-site py-8">
        <LoadingSpinner label={t('Loading…', 'लोड हो रहा है…')} />
      </div>
    );
  }

  if (!isGeneral && (error || !job)) {
    return (
      <div className="container-site py-16">
        <Breadcrumbs items={[{ label: 'Careers', href: '/careers' }, { label: 'Not Found' }]} />
        <div className="mt-6 bg-white border border-bone-300">
          <ErrorState message={t('This position could not be found.', 'यह पद नहीं मिल सका।')} />
          <div className="text-center pb-10">
            <Link href="/careers" className="btn-outline">
              {t('View all open positions', 'सभी खुले पद देखें')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // A job can close between the listing being cached and this page loading.
  // Hide the form rather than letting someone fill it in and be rejected on
  // submit — the server would refuse it anyway, but after they had done the work.
  const closed = !isGeneral && !isJobOpen(job);
  const locations = job ? locationNames(job) : [];

  return (
    <div>
      <section className="bg-charcoal text-ivory py-12">
        <div className="container-site">
          <Breadcrumbs
            items={[
              { label: 'Careers', href: '/careers' },
              {
                label: isGeneral ? 'General Application' : job?.title || 'Position',
                href: isGeneral ? undefined : `/careers/${jobSlug}`,
              },
              { label: 'Apply' },
            ]}
          />
          <h1 className="heading-serif text-3xl md:text-4xl text-ivory mt-4">
            {isGeneral ? t('General Application', 'सामान्य आवेदन') : t('Apply for this Position', 'इस पद के लिए आवेदन करें')}
          </h1>
          {!isGeneral && job?.title && <p className="text-ivory/70 mt-2">{job.title}</p>}
        </div>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="max-w-2xl mx-auto">
            {closed ? (
              <div className="bg-white border border-bone-300 p-8">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-error shrink-0 mt-0.5" />
                  <div>
                    <h2 className="heading-serif text-xl text-charcoal mb-2">
                      {t('Applications Closed', 'आवेदन बंद')}
                    </h2>
                    <p className="text-stone leading-relaxed">
                      {t(
                        'This position is no longer accepting applications.',
                        'यह पद अब आवेदन स्वीकार नहीं कर रहा है।'
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <Link href="/careers" className="btn-outline">
                        {t('View other openings', 'अन्य रिक्तियां देखें')}
                      </Link>
                      <Link href="/careers/general-application/apply" className="btn-ghost">
                        {t('Submit a general application', 'सामान्य आवेदन जमा करें')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white border border-bone-300 p-6 lg:p-8">
                  <JobApplicationForm
                    jobSlug={isGeneral ? undefined : job?.slug}
                    jobTitle={isGeneral ? undefined : job?.title}
                    locations={locations}
                    isGeneral={isGeneral}
                  />
                </div>

                <p className="flex items-start justify-center gap-2 text-sm text-stone mt-6 max-w-lg mx-auto text-center">
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>
                    {t(
                      'Your information and CV are stored privately and used only for recruitment purposes.',
                      'आपकी जानकारी और CV निजी रूप से संग्रहीत की जाती है और केवल भर्ती उद्देश्यों के लिए उपयोग की जाती है।'
                    )}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
