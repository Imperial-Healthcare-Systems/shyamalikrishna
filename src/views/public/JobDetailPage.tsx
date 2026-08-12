'use client';
import type { Job } from '@/lib/types';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Briefcase, Clock, Award, Calendar, ArrowRight } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useJob } from '@/lib/hooks';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { Reveal } from '@/components/ui/Reveal';
import { formatDate } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

interface JobDetailPageProps {
  initialJob?: Job | null;
}

export function JobDetailPage({ initialJob }: JobDetailPageProps = {}) {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const { t } = useLang();
  const router = useRouter();
  const { data: job, loading, error } = useJob(jobSlug, initialJob);

  useSEO({
    title: job ? `${job.title} — Careers` : 'Job Not Found',
    description: job?.seo_description || job?.summary || 'Job posting details.',
    canonical: `https://www.shyamalikrishna.com/careers/${jobSlug}`,
    ogType: 'article',
    structuredData: job ? {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.summary || '',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Shyamali Krishna Automobile Private Limited',
      },
      jobLocation: job.location ? {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: job.location },
      } : undefined,
      employmentType: job.employment_type,
      datePosted: job.published_at || job.created_at,
      validThrough: job.application_deadline || undefined,
    } : undefined,
  });

  if (loading) {
    return (
      <div className="container-site py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container-site py-8">
        <Breadcrumbs items={[{ label: 'Careers', href: '/careers' }, { label: 'Not Found' }]} />
        <ErrorState message={t('This position could not be found or is no longer open.', 'यह पद नहीं मिल सका या अब उपलब्ध नहीं है।')} />
      </div>
    );
  }

  const isExpired = job.application_deadline && new Date(job.application_deadline) < new Date();

  return (
    <div>
      <section className="bg-charcoal text-ivory py-12 lg:py-16">
        <div className="container-site">
          <Breadcrumbs items={[
            { label: 'Careers', href: '/careers' },
            { label: job.title },
          ]} />
          <div className="max-w-3xl mt-6">
            <h1 className="heading-serif text-3xl md:text-4xl lg:text-5xl text-ivory mb-4">{job.title}</h1>
            {job.summary && (
              <p className="text-lg text-ivory/80 leading-relaxed mb-6">{job.summary}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-ivory/70">
              {job.department && (
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-gold-300" /> {job.department}</span>
              )}
              {job.location && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gold-300" /> {job.location}</span>
              )}
              {job.employment_type && (
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gold-300" /> {job.employment_type}</span>
              )}
              {job.experience && (
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold-300" /> {job.experience}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-8">
              {job.responsibilities && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-xl text-charcoal mb-3">{t('Responsibilities', 'जिम्मेदारियां')}</h2>
                    <ul className="space-y-2">
                      {job.responsibilities.split('\n').map((item, index) => (
                        item.trim() && (
                          <li key={index} className="flex items-start gap-2 text-stone text-sm">
                            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0 mt-2" />
                            <span>{item.trim()}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {job.requirements && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-xl text-charcoal mb-3">{t('Requirements', 'आवश्यकताएं')}</h2>
                    <ul className="space-y-2">
                      {job.requirements.split('\n').map((item, index) => (
                        item.trim() && (
                          <li key={index} className="flex items-start gap-2 text-stone text-sm">
                            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0 mt-2" />
                            <span>{item.trim()}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {job.preferred_qualifications && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-xl text-charcoal mb-3">{t('Preferred Qualifications', 'पसंदीदा योग्यताएं')}</h2>
                    <p className="text-stone text-sm whitespace-pre-line">{job.preferred_qualifications}</p>
                  </div>
                </Reveal>
              )}

              {job.what_we_offer && (
                <Reveal>
                  <div className="p-6 bg-bone border-l-4 border-gold">
                    <h2 className="heading-serif text-xl text-charcoal mb-3">{t('What We Offer', 'हम क्या प्रदान करते हैं')}</h2>
                    <p className="text-stone text-sm whitespace-pre-line">{job.what_we_offer}</p>
                  </div>
                </Reveal>
              )}
            </div>

            <aside className="lg:col-span-4">
              <div className="bg-white border border-bone-300 p-6 sticky top-24">
                {job.application_deadline && (
                  <div className="mb-4 pb-4 border-b border-bone-200">
                    <div className="flex items-center gap-2 text-xs text-stone mb-1">
                      <Calendar className="w-4 h-4" />
                      {t('Application Deadline', 'आवेदन अंतिम तिथि')}
                    </div>
                    <div className={`font-medium ${isExpired ? 'text-error' : 'text-charcoal'}`}>
                      {formatDate(job.application_deadline)}
                      {isExpired && <span className="text-error text-xs ml-2">({t('Closed', 'बंद')})</span>}
                    </div>
                  </div>
                )}

                {isExpired ? (
                  <p className="text-sm text-stone text-center py-4">
                    {t('Applications for this position are now closed.', 'इस पद के लिए आवेदन अब बंद हैं।')}
                  </p>
                ) : (
                  <button
                    onClick={() => router.push(`/careers/${job.slug}/apply`)}
                    className="btn-gold w-full"
                  >
                    {t('Apply for this Position', 'इस पद के लिए आवेदन करें')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <Link href="/careers" className="block text-center text-sm text-stone hover:text-gold transition-colors mt-4">
                  ← {t('Back to all positions', 'सभी पदों पर वापस')}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
