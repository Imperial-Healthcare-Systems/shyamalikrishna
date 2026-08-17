'use client';
import type { Job, JobCategory, JobLocation } from '@/lib/types';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  Search, MapPin, Briefcase, Clock, ArrowRight, Users, Award, Heart,
  Layers, Wallet, CalendarClock, X, SlidersHorizontal,
} from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useJobs, useJobCategories, useJobLocations } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Reveal } from '@/components/ui/Reveal';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/States';
import { useLang } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { isDeadlinePassed } from '@/lib/types';
import { locationNames, categoryName, experienceLabel, salaryLabel } from '@/lib/careers';

interface CareersPageProps {
  initialJobs?: Job[];
  initialCategories?: JobCategory[];
  initialLocations?: JobLocation[];
}

const PAGE_SIZE = 8;

export function CareersPage({ initialJobs, initialCategories, initialLocations }: CareersPageProps = {}) {
  const { t, lang } = useLang();

  const { data: jobs, loading, error } = useJobs(initialJobs);
  const { data: categories } = useJobCategories(initialCategories);
  const { data: locations } = useJobLocations(initialLocations);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [experience, setExperience] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useSEO({
    title: 'Careers — Shyamali Krishna Automobile',
    description:
      'Explore current openings at Shyamali Krishna Automobile Private Limited — an authorized multi-brand agricultural machinery dealer serving Nawada and adjoining districts of Bihar.',
    canonical: 'https://www.shyamalikrishna.com/careers',
  });

  const allJobs = jobs || [];

  // Filter option lists come from the jobs actually on the page, falling back
  // to the admin-managed lookups. A filter that matches nothing is worse than
  // a filter that isn't offered.
  const employmentTypes = useMemo(
    () => Array.from(new Set(allJobs.map((j) => j.employment_type).filter(Boolean))) as string[],
    [allJobs]
  );

  const experienceOptions = useMemo(
    () => Array.from(new Set(allJobs.map((j) => experienceLabel(j)).filter(Boolean))) as string[],
    [allJobs]
  );

  const categoryOptions = useMemo(() => {
    const used = new Set(allJobs.map((j) => categoryName(j)).filter(Boolean) as string[]);
    const fromLookup = (categories || []).map((c) => c.name).filter((name) => used.has(name));
    // Anything on a job but missing from the lookup (a deleted category) still
    // needs to be filterable, so union the two.
    const extras = Array.from(used).filter((name) => !fromLookup.includes(name));
    return [...fromLookup, ...extras];
  }, [allJobs, categories]);

  const locationOptions = useMemo(() => {
    const used = new Set(allJobs.flatMap((j) => locationNames(j)));
    const fromLookup = (locations || []).map((l) => l.name).filter((name) => used.has(name));
    const extras = Array.from(used).filter((name) => !fromLookup.includes(name));
    return [...fromLookup, ...extras];
  }, [allJobs, locations]);

  const filtered = useMemo(() => {
    // Guard against a pathological paste into the search box.
    const term = search.trim().toLowerCase().slice(0, 120);

    return allJobs.filter((job) => {
      if (term) {
        const haystack = [
          job.title,
          job.title_hi,
          job.summary,
          job.description,
          categoryName(job),
          job.skills,
          ...locationNames(job),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (category !== 'all' && categoryName(job) !== category) return false;
      if (location !== 'all' && !locationNames(job).includes(location)) return false;
      if (employmentType !== 'all' && job.employment_type !== employmentType) return false;
      if (experience !== 'all' && experienceLabel(job) !== experience) return false;
      return true;
    });
  }, [allJobs, search, category, location, employmentType, experience]);

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (location !== 'all' ? 1 : 0) +
    (employmentType !== 'all' ? 1 : 0) +
    (experience !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setLocation('all');
    setEmploymentType('all');
    setExperience('all');
    setVisible(PAGE_SIZE);
  };

  const shown = filtered.slice(0, visible);
  const totalVacancies = allJobs.reduce((sum, job) => sum + (job.vacancies || 0), 0);

  const whyWorkWithUs = [
    {
      icon: <Users className="w-6 h-6 text-gold" />,
      title: t('Growing Organization', 'बढ़ता संगठन'),
      desc: t(
        'Be part of an established business expanding its reach across Bihar and adjoining regions.',
        'बिहार और आसपास के क्षेत्रों में अपनी पहुंच बढ़ाते हुए एक स्थापित व्यवसाय का हिस्सा बनें।'
      ),
    },
    {
      icon: <Award className="w-6 h-6 text-gold" />,
      title: t('Multi-Brand Expertise', 'मल्टी-ब्रांड विशेषज्ञता'),
      desc: t(
        'Work with a portfolio spanning Indian and international agricultural machinery manufacturers.',
        'भारतीय और अंतर्राष्ट्रीय कृषि मशीनरी निर्माताओं के पोर्टफोलियो के साथ काम करें।'
      ),
    },
    {
      icon: <Heart className="w-6 h-6 text-gold" />,
      title: t('Farmer-Facing Work', 'किसान-मुखी कार्य'),
      desc: t(
        'Your work directly supports farmers and agricultural operations across the region.',
        'आपका काम क्षेत्र भर के किसानों और कृषि परिचालनों का सीधे समर्थन करता है।'
      ),
    },
  ];

  const selectClass = 'input-field';

  return (
    <div>
      <PageHero
        eyebrow={t('Careers', 'करियर')}
        title={t('Build Your Career With Us', 'हमारे साथ अपना करियर बनाएं')}
        subtitle={t(
          'Explore opportunities to grow, contribute and build your career with us.',
          'हमारे साथ बढ़ने, योगदान देने और अपना करियर बनाने के अवसरों को देखें।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'Careers', href: '/careers' }]} />}
        image="/careers-team.webp"
        imageAlt="The Shyamali Krishna Automobile sales and service team at work in the dealership yard"
      >
        {allJobs.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <span className="text-ivory/80">
              <strong className="text-gold-300 text-lg">{allJobs.length}</strong>{' '}
              {allJobs.length === 1 ? t('open position', 'खुला पद') : t('open positions', 'खुले पद')}
            </span>
            {totalVacancies > 0 && (
              <span className="text-ivory/80">
                <strong className="text-gold-300 text-lg">{totalVacancies}</strong>{' '}
                {t('vacancies', 'रिक्तियां')}
              </span>
            )}
            {locationOptions.length > 0 && (
              <span className="text-ivory/80">
                <strong className="text-gold-300 text-lg">{locationOptions.length}</strong>{' '}
                {locationOptions.length === 1 ? t('location', 'स्थान') : t('locations', 'स्थान')}
              </span>
            )}
          </div>
        )}
      </PageHero>

      {/* Why work with us */}
      <section className="bg-bone py-16">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyWorkWithUs.map((point, index) => (
              <Reveal key={index} delay={index * 50}>
                <div className="h-full bg-white p-6 border border-bone-300">
                  <div className="w-12 h-12 bg-charcoal text-gold flex items-center justify-center mb-4">
                    {point.icon}
                  </div>
                  <h3 className="heading-serif text-lg text-charcoal mb-2">{point.title}</h3>
                  <p className="text-sm text-stone leading-relaxed">{point.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section id="openings" className="section-padding">
        <div className="container-site">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-gold">
                {t('Openings', 'रिक्तियां')}
              </span>
              <h2 className="heading-serif text-3xl text-charcoal mt-2">{t('Open Positions', 'खुले पद')}</h2>
            </div>
            {!loading && allJobs.length > 0 && (
              <p className="text-sm text-stone">
                {filtered.length === allJobs.length
                  ? t(`Showing all ${allJobs.length}`, `सभी ${allJobs.length} दिखा रहे हैं`)
                  : t(`${filtered.length} of ${allJobs.length} match your filters`, `${allJobs.length} में से ${filtered.length} मेल खाते हैं`)}
              </p>
            )}
          </div>

          {/* Search and filters */}
          {allJobs.length > 0 && (
            <div className="bg-bone-50 border border-bone-300 p-4 sm:p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-4 h-4 text-gold" />
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-charcoal">
                  {t('Find a role', 'भूमिका खोजें')}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-4 relative">
                  <label htmlFor="job-search" className="sr-only">
                    {t('Search by job title or keyword', 'पद या कीवर्ड से खोजें')}
                  </label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
                  <input
                    id="job-search"
                    type="search"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
                    placeholder={t('Search job title or keyword…', 'पद या कीवर्ड खोजें…')}
                    maxLength={120}
                    className="input-field pl-9"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="job-category" className="sr-only">{t('Job category', 'श्रेणी')}</label>
                  <select
                    id="job-category"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setVisible(PAGE_SIZE); }}
                    className={selectClass}
                  >
                    <option value="all">{t('All categories', 'सभी श्रेणियां')}</option>
                    {categoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="job-location" className="sr-only">{t('Location', 'स्थान')}</label>
                  <select
                    id="job-location"
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); setVisible(PAGE_SIZE); }}
                    className={selectClass}
                  >
                    <option value="all">{t('All locations', 'सभी स्थान')}</option>
                    {locationOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="job-type" className="sr-only">{t('Employment type', 'रोजगार प्रकार')}</label>
                  <select
                    id="job-type"
                    value={employmentType}
                    onChange={(e) => { setEmploymentType(e.target.value); setVisible(PAGE_SIZE); }}
                    className={selectClass}
                  >
                    <option value="all">{t('All types', 'सभी प्रकार')}</option>
                    {employmentTypes.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="job-experience" className="sr-only">{t('Experience level', 'अनुभव स्तर')}</label>
                  <select
                    id="job-experience"
                    value={experience}
                    onChange={(e) => { setExperience(e.target.value); setVisible(PAGE_SIZE); }}
                    className={selectClass}
                    disabled={experienceOptions.length === 0}
                  >
                    <option value="all">{t('Any experience', 'कोई भी अनुभव')}</option>
                    {experienceOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 pt-4 border-t border-bone-300 flex items-center justify-between gap-3">
                  <span className="text-sm text-stone">
                    {t(
                      `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} applied`,
                      `${activeFilterCount} फ़िल्टर लागू`
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-600 transition-colors min-h-[44px]"
                  >
                    <X className="w-4 h-4" />
                    {t('Clear filters', 'फ़िल्टर हटाएं')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <LoadingSpinner label={t('Loading positions…', 'पद लोड हो रहे हैं…')} />
          ) : error ? (
            <div className="bg-white border border-bone-300">
              <ErrorState
                message={t('Unable to load jobs. Please try again.', 'पद लोड नहीं हो सके। कृपया पुनः प्रयास करें।')}
                onRetry={() => window.location.reload()}
              />
            </div>
          ) : allJobs.length === 0 ? (
            <div className="bg-white border border-bone-300">
              <EmptyState
                title={t('No current openings', 'इस समय कोई रिक्ति नहीं')}
                message={t(
                  'Please check back later for new opportunities. You may also submit a general application and we will keep your details on file.',
                  'नए अवसरों के लिए कृपया बाद में देखें। आप एक सामान्य आवेदन भी जमा कर सकते हैं और हम आपका विवरण सुरक्षित रखेंगे।'
                )}
                actionLabel={t('Submit general application', 'सामान्य आवेदन जमा करें')}
                actionHref="/careers/general-application/apply"
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-bone-300 py-16 px-4 text-center">
              <h3 className="heading-serif text-2xl text-charcoal mb-2">
                {t('No jobs found', 'कोई पद नहीं मिला')}
              </h3>
              <p className="text-stone max-w-md mx-auto mb-6">
                {t(
                  'No openings match the filters you selected. Try widening your search.',
                  'आपके चयनित फ़िल्टर से कोई रिक्ति मेल नहीं खाती। खोज व्यापक करके देखें।'
                )}
              </p>
              <button type="button" onClick={clearFilters} className="btn-outline">
                <X className="w-4 h-4" />
                {t('Clear filters', 'फ़िल्टर हटाएं')}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {shown.map((job, index) => (
                  <Reveal key={job.id} delay={Math.min(index, 6) * 40}>
                    <JobCard job={job} t={t} lang={lang} />
                  </Reveal>
                ))}
              </div>

              {filtered.length > visible && (
                <div className="mt-8 text-center">
                  <button type="button" onClick={() => setVisible(visible + PAGE_SIZE)} className="btn-outline">
                    {t(
                      `Load more (${filtered.length - visible} remaining)`,
                      `और देखें (${filtered.length - visible} शेष)`
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* General application */}
          {allJobs.length > 0 && (
            <div className="mt-12 p-6 bg-bone border-l-4 border-gold">
              <h3 className="heading-serif text-lg text-charcoal mb-2">
                {t("Don't see the right role?", 'सही भूमिका नहीं दिख रही?')}
              </h3>
              <p className="text-sm text-stone mb-4 max-w-2xl">
                {t(
                  'Submit a general application and we will contact you when a matching opportunity arises.',
                  'एक सामान्य आवेदन जमा करें और जब मेल खाता अवसर आएगा तो हम आपसे संपर्क करेंगे।'
                )}
              </p>
              <Link href="/careers/general-application/apply" className="btn-outline">
                {t('Submit General Application', 'सामान्य आवेदन जमा करें')}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function JobCard({
  job,
  t,
  lang,
}: {
  job: Job;
  t: (en: string, hi?: string) => string;
  lang: 'en' | 'hi';
}) {
  const category = categoryName(job);
  const places = locationNames(job);
  const experience = experienceLabel(job);
  const salary = salaryLabel(job);
  const closed = isDeadlinePassed(job.application_deadline);
  const shortDescription = t(job.summary || '', job.summary_hi || job.summary || '');

  // Every meta row is conditional — a field the admin left blank must not
  // render as a stray icon with nothing after it.
  const meta: Array<{ icon: React.ReactNode; label: string }> = [];
  if (category) meta.push({ icon: <Layers className="w-3.5 h-3.5" />, label: category });
  if (places.length > 0) {
    meta.push({
      icon: <MapPin className="w-3.5 h-3.5" />,
      label: places.length > 3 ? `${places.slice(0, 3).join(', ')} +${places.length - 3}` : places.join(', '),
    });
  }
  if (job.vacancies > 0) {
    meta.push({
      icon: <Users className="w-3.5 h-3.5" />,
      label: t(
        `${job.vacancies} ${job.vacancies === 1 ? 'vacancy' : 'vacancies'}`,
        `${job.vacancies} रिक्ति`
      ),
    });
  }
  if (job.employment_type) meta.push({ icon: <Clock className="w-3.5 h-3.5" />, label: job.employment_type });
  if (experience) meta.push({ icon: <Briefcase className="w-3.5 h-3.5" />, label: experience });
  if (salary) meta.push({ icon: <Wallet className="w-3.5 h-3.5" />, label: salary });

  return (
    <article className="group bg-white border border-bone-300 hover:border-gold transition-colors p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="heading-serif text-xl text-charcoal">
              <Link href={`/careers/${job.slug}`} className="hover:text-gold transition-colors">
                {t(job.title, job.title_hi || job.title)}
              </Link>
            </h3>
            {closed && (
              <span className="badge bg-error/10 text-error border border-error/20">
                {t('Applications closed', 'आवेदन बंद')}
              </span>
            )}
          </div>

          {shortDescription && (
            <p className="text-sm text-stone leading-relaxed line-clamp-2 mb-3 max-w-3xl">{shortDescription}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone">
            {meta.map((item, index) => (
              <span key={index} className="inline-flex items-center gap-1.5">
                <span className="text-gold">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-stone-400">
            {job.published_at && (
              <span>{t('Posted', 'पोस्ट किया')} {formatDate(job.published_at, lang)}</span>
            )}
            {job.application_deadline && (
              <span className={`inline-flex items-center gap-1 ${closed ? 'text-error' : ''}`}>
                <CalendarClock className="w-3.5 h-3.5" />
                {t('Apply by', 'अंतिम तिथि')} {formatDate(job.application_deadline, lang)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-44">
          <Link href={`/careers/${job.slug}`} className="btn-outline text-sm w-full">
            {t('View Details', 'विवरण देखें')}
          </Link>
          {closed ? (
            <span className="btn text-sm w-full bg-bone text-stone cursor-not-allowed" aria-disabled="true">
              {t('Closed', 'बंद')}
            </span>
          ) : (
            <Link href={`/careers/${job.slug}/apply`} className="btn-gold text-sm w-full">
              {t('Apply Now', 'आवेदन करें')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
