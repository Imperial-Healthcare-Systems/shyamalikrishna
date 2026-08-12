'use client';
import type { Job } from '@/lib/types';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Search, MapPin, Briefcase, Clock, ArrowRight, Users, Award, Heart } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useJobs } from '@/lib/hooks';
import { PageHero } from '@/components/ui/Section';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Reveal } from '@/components/ui/Reveal';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { useLang } from '@/lib/i18n';

interface CareersPageProps {
  initialJobs?: Job[];
}

export function CareersPage({ initialJobs }: CareersPageProps = {}) {
  const { t } = useLang();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [location, setLocation] = useState('all');

  const { data: jobs, loading } = useJobs({
    search,
    department,
    employmentType,
    location,
  }, initialJobs);

  useSEO({
    title: 'Careers — Shyamali Krishna Automobile',
    description: 'Join Shyamali Krishna Automobile — a premium multi-brand agricultural machinery dealer serving Bihar. Explore open positions and submit your application.',
    canonical: 'https://www.shyamalikrishna.com/careers',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Careers at Shyamali Krishna Automobile',
      description: 'Explore career opportunities at Shyamali Krishna Automobile Private Limited.',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Shyamali Krishna Automobile Private Limited',
      },
    },
  });

  const departments = useMemo(() => {
    return Array.from(new Set((jobs || []).map(j => j.department).filter(Boolean))) as string[];
  }, [jobs]);

  const locations = useMemo(() => {
    return Array.from(new Set((jobs || []).map(j => j.location).filter(Boolean))) as string[];
  }, [jobs]);

  const employmentTypes = useMemo(() => {
    return Array.from(new Set((jobs || []).map(j => j.employment_type).filter(Boolean))) as string[];
  }, [jobs]);

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

  return (
    <div>
      <PageHero
        eyebrow={t('Careers', 'करियर')}
        title={t('Build a Career in Agricultural Machinery', 'कृषि मशीनरी में करियर बनाएं')}
        subtitle={t(
          'Join a team that connects farmers with the right machinery — from Italian-engineered tillage systems to precision seeders and threshers.',
          'एक टीम में शामिल हों जो किसानों को सही मशीनरी से जोड़ती है।'
        )}
        breadcrumb={<Breadcrumbs items={[{ label: 'Careers', href: '/careers' }]} />}
        image="/careers-team.webp"
        imageAlt="The Shyamali Krishna Automobile sales and service team at work in the dealership yard"
      />

      {/* Why work with us */}
      <section className="bg-bone py-16">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyWorkWithUs.map((point, index) => (
              <Reveal key={index} delay={index * 50}>
                <div className="bg-white p-6 border border-bone-300">
                  <div className="w-12 h-12 bg-charcoal text-gold flex items-center justify-center mb-4">
                    {point.icon}
                  </div>
                  <h3 className="heading-serif text-lg text-charcoal mb-2">{point.title}</h3>
                  <p className="text-sm text-stone">{point.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section className="section-padding">
        <div className="container-site">
          <h2 className="heading-serif text-3xl text-charcoal mb-8">{t('Open Positions', 'खुली पद')}</h2>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('Search positions…', 'पद खोजें…')}
                className="input-field pl-9"
                aria-label="Search jobs"
              />
            </div>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field" aria-label="Filter by department">
              <option value="all">{t('All Departments', 'सभी विभाग')}</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="input-field" aria-label="Filter by employment type">
              <option value="all">{t('All Types', 'सभी प्रकार')}</option>
              {employmentTypes.map(et => <option key={et} value={et}>{et}</option>)}
            </select>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" aria-label="Filter by location">
              <option value="all">{t('All Locations', 'सभी स्थान')}</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {loading ? (
            <LoadingSpinner label={t('Loading positions…', 'पद लोड हो रहे हैं…')} />
          ) : (jobs || []).length === 0 ? (
            <EmptyState
              title={t('No open positions at the moment', 'इस समय कोई पद रिक्त नहीं')}
              message={t(
                'We do not have any open positions at the moment. You may still submit a general application and we will retain your details for relevant future opportunities.',
                'इस समय हमारे पास कोई रिक्त पद नहीं है। आप अभी भी एक सामान्य आवेदन जमा कर सकते हैं और हम भविष्य के अवसरों के लिए आपका विवरण रखेंगे।'
              )}
              actionLabel={t('Submit general application', 'सामान्य आवेदन जमा करें')}
              actionHref="/careers/general-application/apply"
            />
          ) : (
            <div className="space-y-4">
              {(jobs || []).map((job, index) => (
                <Reveal key={job.id} delay={index * 50}>
                  <Link
                    href={`/careers/${job.slug}`}
                    className="group block bg-white border border-bone-300 hover:border-gold transition-all p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="heading-serif text-lg text-charcoal group-hover:text-gold transition-colors mb-2">
                          {job.title}
                        </h3>
                        {job.summary && (
                          <p className="text-sm text-stone line-clamp-2 mb-3">{job.summary}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-stone">
                          {job.department && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" /> {job.department}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {job.location}
                            </span>
                          )}
                          {job.employment_type && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {job.employment_type}
                            </span>
                          )}
                          {job.experience && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" /> {job.experience}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gold shrink-0">
                        {t('View & Apply', 'देखें और आवेदन करें')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          {/* General application CTA */}
          <div className="mt-12 p-6 bg-bone border-l-4 border-gold">
            <h3 className="heading-serif text-lg text-charcoal mb-2">
              {t('Don\'t see the right role?', 'सही भूमिका नहीं दिख रही?')}
            </h3>
            <p className="text-sm text-stone mb-4">
              {t(
                'Submit a general application and we will contact you when a matching opportunity arises.',
                'एक सामान्य आवेदन जमा करें और जब एक मेल खाता अवसर आएगा तो हम आपसे संपर्क करेंगे।'
              )}
            </p>
            <button onClick={() => router.push('/careers/general-application/apply')} className="btn-outline">
              {t('Submit General Application', 'सामान्य आवेदन जमा करें')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
