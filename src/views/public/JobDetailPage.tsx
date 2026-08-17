'use client';
import type { Job } from '@/lib/types';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin, Briefcase, Clock, Users, Layers, Wallet, CalendarClock,
  ArrowRight, Phone, Info, AlertCircle,
} from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useJob } from '@/lib/hooks';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { Reveal } from '@/components/ui/Reveal';
import { formatDate } from '@/lib/utils';
import { useLang } from '@/lib/i18n';
import { isJobOpen, isDeadlinePassed, toList } from '@/lib/types';
import { locationNames, categoryName, experienceLabel, salaryLabel } from '@/lib/careers';

interface JobDetailPageProps {
  initialJob?: Job | null;
}

export function JobDetailPage({ initialJob }: JobDetailPageProps = {}) {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const { t, lang } = useLang();
  const { data: job, loading, error } = useJob(jobSlug, initialJob);

  const category = job ? categoryName(job) : null;
  const places = job ? locationNames(job) : [];
  const experience = job ? experienceLabel(job) : null;
  const salary = job ? salaryLabel(job) : null;
  const open = isJobOpen(job);
  const deadlinePassed = job ? isDeadlinePassed(job.application_deadline) : false;

  useSEO({
    title: job ? `${job.title} Jobs | Shyamali Krishna Automobile` : 'Position Not Found',
    description:
      job?.seo_description ||
      job?.summary ||
      (job
        ? `Apply for the ${job.title} vacancy at Shyamali Krishna Automobile Private Limited, Nawada, Bihar.`
        : 'Job posting details.'),
    canonical: `https://www.shyamalikrishna.com/careers/${jobSlug}`,
    ogType: 'article',
    structuredData: job
      ? {
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: job.title,
          description: job.description || job.summary || '',
          identifier: { '@type': 'PropertyValue', name: 'Shyamali Krishna Automobile', value: job.slug },
          hiringOrganization: {
            '@type': 'Organization',
            name: 'Shyamali Krishna Automobile Private Limited',
            sameAs: 'https://www.shyamalikrishna.com',
          },
          employmentType: job.employment_type || undefined,
          datePosted: job.published_at || job.created_at,
          validThrough: job.application_deadline || undefined,
          totalJobOpenings: job.vacancies || undefined,
          occupationalCategory: category || undefined,
          jobLocation: places.length
            ? places.map((place) => ({
                '@type': 'Place',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: place,
                  addressRegion: 'Bihar',
                  addressCountry: 'IN',
                },
              }))
            : undefined,
        }
      : undefined,
  });

  if (loading) {
    return (
      <div className="container-site py-8">
        <LoadingSpinner label={t('Loading position…', 'पद लोड हो रहा है…')} />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container-site py-16">
        <Breadcrumbs items={[{ label: 'Careers', href: '/careers' }, { label: 'Not Found' }]} />
        <div className="mt-6 bg-white border border-bone-300">
          <ErrorState
            message={t(
              'This position could not be found. It may have been filled or removed.',
              'यह पद नहीं मिल सका। यह भर चुका है या हटा दिया गया है।'
            )}
          />
          <div className="text-center pb-10">
            <Link href="/careers" className="btn-outline">
              {t('View all open positions', 'सभी खुले पद देखें')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const responsibilities = toList(job.responsibilities);
  const requirements = toList(job.requirements);
  const skills = toList(job.skills);
  const fullDescription = t(job.description || '', job.description_hi || job.description || '');

  const facts: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
  if (category) facts.push({ icon: <Layers className="w-4 h-4" />, label: t('Category', 'श्रेणी'), value: category });
  if (job.vacancies > 0) {
    facts.push({
      icon: <Users className="w-4 h-4" />,
      label: t('Vacancies', 'रिक्तियां'),
      value: String(job.vacancies),
    });
  }
  if (places.length) {
    facts.push({
      icon: <MapPin className="w-4 h-4" />,
      label: places.length === 1 ? t('Location', 'स्थान') : t('Locations', 'स्थान'),
      value: places.join(', '),
    });
  }
  if (job.employment_type) {
    facts.push({ icon: <Clock className="w-4 h-4" />, label: t('Employment Type', 'रोजगार प्रकार'), value: job.employment_type });
  }
  if (experience) {
    facts.push({ icon: <Briefcase className="w-4 h-4" />, label: t('Experience', 'अनुभव'), value: experience });
  }
  if (salary) {
    facts.push({ icon: <Wallet className="w-4 h-4" />, label: t('Salary', 'वेतन'), value: salary });
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-charcoal text-ivory py-12 lg:py-16">
        <div className="container-site">
          <Breadcrumbs items={[{ label: 'Careers', href: '/careers' }, { label: job.title }]} />
          <div className="max-w-3xl mt-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {category && (
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-gold-300">{category}</span>
              )}
              {!open && (
                <span className="badge bg-ivory/10 text-ivory border border-ivory/20">
                  {t('Applications closed', 'आवेदन बंद')}
                </span>
              )}
            </div>

            <h1 className="heading-serif text-3xl md:text-4xl lg:text-5xl text-ivory text-balance">
              {t(job.title, job.title_hi || job.title)}
            </h1>

            {job.summary && (
              <p className="text-lg text-ivory/80 leading-relaxed mt-5">
                {t(job.summary, job.summary_hi || job.summary)}
              </p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ivory/70 mt-6">
              {places.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gold-300" /> {places.join(', ')}
                </span>
              )}
              {job.vacancies > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gold-300" />
                  {t(
                    `${job.vacancies} ${job.vacancies === 1 ? 'vacancy' : 'vacancies'}`,
                    `${job.vacancies} रिक्ति`
                  )}
                </span>
              )}
              {job.employment_type && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gold-300" /> {job.employment_type}
                </span>
              )}
              {job.published_at && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-gold-300" />
                  {t('Posted', 'पोस्ट किया')} {formatDate(job.published_at, lang)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main */}
            <div className="lg:col-span-8 space-y-8">
              {fullDescription && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">
                      {t('About the Role', 'भूमिका के बारे में')}
                    </h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">{fullDescription}</p>
                  </div>
                </Reveal>
              )}

              {responsibilities.length > 0 && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">
                      {t('Responsibilities', 'जिम्मेदारियां')}
                    </h2>
                    <ul className="space-y-2.5">
                      {responsibilities.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-stone">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0 mt-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {requirements.length > 0 && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">
                      {t('Requirements', 'आवश्यकताएं')}
                    </h2>
                    <ul className="space-y-2.5">
                      {requirements.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-stone">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0 mt-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {skills.length > 0 && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">{t('Skills', 'कौशल')}</h2>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <span key={index} className="badge bg-bone text-charcoal border border-bone-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {job.preferred_qualifications && (
                <Reveal>
                  <div>
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">
                      {t('Preferred Qualifications', 'पसंदीदा योग्यताएं')}
                    </h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">{job.preferred_qualifications}</p>
                  </div>
                </Reveal>
              )}

              {job.what_we_offer && (
                <Reveal>
                  <div className="p-6 bg-bone border-l-4 border-gold">
                    <h2 className="heading-serif text-2xl text-charcoal mb-3">
                      {t('What We Offer', 'हम क्या प्रदान करते हैं')}
                    </h2>
                    <p className="text-stone leading-relaxed whitespace-pre-line">{job.what_we_offer}</p>
                  </div>
                </Reveal>
              )}

              {job.additional_notes && (
                <Reveal>
                  <div className="flex gap-3 p-5 bg-bone-50 border border-bone-300">
                    <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-medium text-charcoal mb-1">
                        {t('Additional Information', 'अतिरिक्त जानकारी')}
                      </h2>
                      <p className="text-sm text-stone leading-relaxed whitespace-pre-line">{job.additional_notes}</p>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Apply box */}
                <div className="bg-white border border-bone-300 p-6">
                  {job.application_deadline && (
                    <div className="mb-4 pb-4 border-b border-bone-200">
                      <div className="flex items-center gap-2 text-xs text-stone mb-1">
                        <CalendarClock className="w-4 h-4" />
                        {t('Application Deadline', 'आवेदन अंतिम तिथि')}
                      </div>
                      <div className={`font-medium ${deadlinePassed ? 'text-error' : 'text-charcoal'}`}>
                        {formatDate(job.application_deadline, lang)}
                      </div>
                    </div>
                  )}

                  {open ? (
                    <>
                      <Link href={`/careers/${job.slug}/apply`} className="btn-gold w-full">
                        {t('Apply Now', 'अभी आवेदन करें')}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <p className="text-xs text-stone mt-3 text-center">
                        {t('PDF, DOC or DOCX CV required.', 'PDF, DOC या DOCX CV आवश्यक है।')}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-bone border-l-4 border-error">
                      <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {t('Applications Closed', 'आवेदन बंद')}
                        </p>
                        <p className="text-sm text-stone mt-1">
                          {t(
                            'This position is no longer accepting applications.',
                            'यह पद अब आवेदन स्वीकार नहीं कर रहा है।'
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <Link
                    href="/careers"
                    className="block text-center text-sm text-stone hover:text-gold transition-colors mt-4"
                  >
                    ← {t('Back to all positions', 'सभी पदों पर वापस')}
                  </Link>
                </div>

                {/* At a glance */}
                {facts.length > 0 && (
                  <div className="bg-bone-50 border border-bone-300 p-6">
                    <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold mb-4">
                      {t('At a Glance', 'एक नज़र में')}
                    </h3>
                    <dl className="space-y-4">
                      {facts.map((fact, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="text-gold shrink-0 mt-0.5">{fact.icon}</span>
                          <div className="min-w-0">
                            <dt className="text-xs text-stone">{fact.label}</dt>
                            <dd className="text-sm font-medium text-charcoal break-words">{fact.value}</dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {job.contact_info && (
                  <div className="bg-field text-ivory p-6">
                    <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-gold-300 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {t('Contact', 'संपर्क')}
                    </h3>
                    <p className="text-sm text-ivory/85 whitespace-pre-line">{job.contact_info}</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
