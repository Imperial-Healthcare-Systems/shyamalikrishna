'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Send, Eye, AlertTriangle } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import { EXPERIENCE_LEVELS, SALARY_PERIODS, slugify } from '@/lib/types';
import {
  AdminCard, Alert, PageHeading, ListEditor,
  INPUT, LABEL, HINT, BTN_PRIMARY, BTN_SECONDARY,
} from '@/views/admin/ui';

interface LookupOption {
  id: string;
  name: string;
  active: boolean;
}

interface JobDraft {
  title: string;
  title_hi: string;
  slug: string;
  category_id: string;
  vacancies: number;
  employment_type: string;
  experience_level: string;
  min_experience: string;
  max_experience: string;
  location_ids: string[];
  status: string;
  summary: string;
  summary_hi: string;
  description: string;
  description_hi: string;
  responsibilities: string;
  requirements: string;
  skills: string;
  preferred_qualifications: string;
  what_we_offer: string;
  salary_type: string;
  salary_min: string;
  salary_max: string;
  salary_period: string;
  salary_negotiable: boolean;
  application_deadline: string;
  contact_info: string;
  additional_notes: string;
  image_url: string;
  seo_title: string;
  seo_description: string;
}

/**
 * Kept in step with ALLOWED_EXTENSIONS in lib/server/image-upload.ts, which is
 * where the real check happens. Not imported from there: that module pulls in
 * node:crypto and must not reach the browser bundle.
 */
const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
const IMAGE_MAX_MB = 4;
/** Mirrors BANNER_* in lib/server/image-upload.ts, which enforces them. */
const BANNER_WIDTH = 1672;
const BANNER_HEIGHT = 941;
const BANNER_MIN_WIDTH = 1200;

/** Sentinel value for the "Custom…" entry in the experience-level select. */
const CUSTOM_OPTION = '__custom__';

const EMPTY: JobDraft = {
  title: '', title_hi: '', slug: '', category_id: '', vacancies: 1, employment_type: '',
  experience_level: '', min_experience: '', max_experience: '', location_ids: [], status: 'draft',
  summary: '', summary_hi: '', description: '', description_hi: '',
  responsibilities: '', requirements: '', skills: '',
  preferred_qualifications: '', what_we_offer: '',
  salary_type: '', salary_min: '', salary_max: '', salary_period: 'month', salary_negotiable: false,
  application_deadline: '', contact_info: '', additional_notes: '', image_url: '',
  seo_title: '', seo_description: '',
};

export function AdminJobEditor() {
  const { id } = useParams<{ id?: string }>();
  const { token } = useAdminAuth();
  const router = useRouter();

  const [job, setJob] = useState<JobDraft>(EMPTY);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [locations, setLocations] = useState<LookupOption[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'draft' | 'published' | 'closed' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Once the admin edits the slug by hand, stop overwriting it from the title.
  const [slugLocked, setSlugLocked] = useState(false);
  // The experience presets cover most roles; this switches the field to free text.
  const [customExperience, setCustomExperience] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    const [cats, locs, types] = await Promise.all([
      adminFetch('/admin-api/job-categories', { token }),
      adminFetch('/admin-api/job-locations', { token }),
      adminFetch('/admin-api/employment-types', { token }),
    ]);

    if (cats.ok) setCategories(cats.data?.data || []);
    if (locs.ok) setLocations(locs.data?.data || []);
    if (types.ok) setEmploymentTypes(types.data?.data || []);

    if (id) {
      const result = await adminFetch('/admin-api/jobs/get', { token, searchParams: { id } });
      if (result.ok && result.data?.job) {
        const j = result.data.job;
        setJob({
          title: j.title || '',
          title_hi: j.title_hi || '',
          slug: j.slug || '',
          category_id: j.category_id || '',
          vacancies: j.vacancies ?? 1,
          employment_type: j.employment_type || '',
          experience_level: j.experience_level || '',
          min_experience: j.min_experience || '',
          max_experience: j.max_experience || '',
          location_ids: j.location_ids || [],
          status: j.status || 'draft',
          summary: j.summary || '',
          summary_hi: j.summary_hi || '',
          description: j.description || '',
          description_hi: j.description_hi || '',
          responsibilities: j.responsibilities || '',
          requirements: j.requirements || '',
          skills: j.skills || '',
          preferred_qualifications: j.preferred_qualifications || '',
          what_we_offer: j.what_we_offer || '',
          salary_type: j.salary_type || '',
          salary_min: j.salary_min === null || j.salary_min === undefined ? '' : String(j.salary_min),
          salary_max: j.salary_max === null || j.salary_max === undefined ? '' : String(j.salary_max),
          salary_period: j.salary_period || 'month',
          salary_negotiable: Boolean(j.salary_negotiable),
          application_deadline: (j.application_deadline || '').slice(0, 10),
          contact_info: j.contact_info || '',
          additional_notes: j.additional_notes || '',
          image_url: j.image_url || '',
          seo_title: j.seo_title || '',
          seo_description: j.seo_description || '',
        });
        setSavedSlug(j.slug || null);
        setSlugLocked(true);
        // A stored value that is not one of the presets was typed in by hand,
        // so reopen the field in custom mode rather than silently dropping it.
        if (j.experience_level && !EXPERIENCE_LEVELS.includes(j.experience_level)) {
          setCustomExperience(true);
        }
      } else {
        setError('Could not load this job. It may have been deleted.');
      }
    }

    setLoading(false);
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => {
    setJob((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Uploads immediately on pick, then stores the returned URL in the draft.
   * The job itself is not written until the admin saves, so choosing an image
   * and navigating away leaves an orphaned object in the bucket rather than a
   * half-saved job — the cheaper of the two failures.
   *
   * Not adminFetch: that helper always sends JSON, and this has to be
   * multipart for the file to survive the trip.
   */
  const uploadImage = async (file: File) => {
    if (!token) return;
    setError(null);
    setSuccess(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/admin/jobs/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || 'Could not upload that image.');
        return;
      }
      set('image_url', data.url || '');
      setSuccess('Image uploaded. Save the job to publish it.');
    } catch {
      setError('Could not upload that image. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    setJob((prev) => ({
      ...prev,
      location_ids: prev.location_ids.includes(locationId)
        ? prev.location_ids.filter((x) => x !== locationId)
        : [...prev.location_ids, locationId],
    }));
  };

  const handleSave = async (status: 'draft' | 'published' | 'closed') => {
    if (!token) return;
    setError(null);
    setSuccess(null);

    // Client-side guards mirror the server's, purely so the admin gets the
    // message next to the field instead of after a round trip. The server
    // re-checks all of it.
    if (!job.title.trim()) {
      setError('Job title is required.');
      return;
    }
    if (!Number.isInteger(Number(job.vacancies)) || Number(job.vacancies) < 1) {
      setError('Number of vacancies must be a whole number of at least 1.');
      return;
    }
    if (status === 'published') {
      if (!job.category_id) {
        setError('Choose a category before publishing.');
        return;
      }
      if (job.location_ids.length === 0) {
        setError('Choose at least one location before publishing.');
        return;
      }
      if (!job.employment_type.trim()) {
        setError('Choose an employment type before publishing.');
        return;
      }
    }

    setSaving(status);

    const result = await adminFetch('/admin-api/jobs/save', {
      method: 'POST',
      body: { id: id || undefined, ...job, vacancies: Number(job.vacancies), status },
      token,
    });

    setSaving(null);

    if (!result.ok) {
      setError(result.data?.error || 'Could not save this job.');
      return;
    }

    const label = status === 'published' ? 'published' : status === 'closed' ? 'closed' : 'saved as draft';
    setSuccess(`"${job.title}" ${label}. Returning to the jobs list…`);
    setSavedSlug(result.data?.job?.slug || savedSlug);
    setTimeout(() => router.push('/admin/jobs'), 1200);
  };

  if (loading) return <LoadingSpinner label="Loading job…" />;

  const activeCategories = categories.filter((c) => c.active || c.id === job.category_id);
  const activeLocations = locations.filter((l) => l.active || job.location_ids.includes(l.id));
  const activeTypes = employmentTypes.filter((t) => t.active || t.name === job.employment_type);
  const busy = saving !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/jobs" className="p-2 hover:bg-gray-100 rounded shrink-0 mt-1" aria-label="Back to jobs">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading
          title={id ? 'Edit Job' : 'Create Job'}
          subtitle={
            id
              ? 'Changes reach the public careers page within about five minutes.'
              : 'Save as a draft while you work — drafts never appear on the public site.'
          }
          actions={
            id && savedSlug && job.status !== 'draft' ? (
              <Link href={`/careers/${savedSlug}`} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
                <Eye className="w-4 h-4" /> View live
              </Link>
            ) : undefined
          }
        />
      </div>

      {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      {categories.length === 0 && (
        <Alert tone="warning">
          You have no job categories yet. <Link href="/admin/job-categories" className="underline font-medium">Add a category</Link> before publishing a job.
        </Alert>
      )}

      {/* Basic information */}
      <AdminCard title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={LABEL} htmlFor="job-title">
              Job Title <span className="text-red-600">*</span>
            </label>
            <input
              id="job-title"
              type="text"
              value={job.title}
              disabled={busy}
              onChange={(e) => {
                const value = e.target.value;
                setJob((prev) => ({
                  ...prev,
                  title: value,
                  slug: slugLocked ? prev.slug : slugify(value),
                }));
              }}
              className={INPUT}
              maxLength={160}
              placeholder="e.g. Salesman"
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="job-title-hi">Job Title (Hindi)</label>
            <input
              id="job-title-hi"
              type="text"
              value={job.title_hi}
              disabled={busy}
              onChange={(e) => set('title_hi', e.target.value)}
              className={INPUT}
              maxLength={160}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="job-slug">Page address (slug)</label>
            <input
              id="job-slug"
              type="text"
              value={job.slug}
              disabled={busy}
              onChange={(e) => {
                setSlugLocked(true);
                set('slug', slugify(e.target.value));
              }}
              className={INPUT}
            />
            <p className={HINT}>
              /careers/{job.slug || 'your-job-title'} — a number is added automatically if this is already taken.
            </p>
          </div>

          <div>
            <label className={LABEL} htmlFor="job-category">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              id="job-category"
              value={job.category_id}
              disabled={busy}
              onChange={(e) => set('category_id', e.target.value)}
              className={INPUT}
            >
              <option value="">Select a category…</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{!c.active ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} htmlFor="job-vacancies">
              Number of Vacancies <span className="text-red-600">*</span>
            </label>
            <input
              id="job-vacancies"
              type="number"
              min={1}
              max={9999}
              value={job.vacancies}
              disabled={busy}
              onChange={(e) => set('vacancies', Number(e.target.value))}
              className={INPUT}
            />
            <p className={HINT}>Informational only — the job stays open until you close it.</p>
          </div>

          <div>
            <label className={LABEL} htmlFor="job-type">
              Employment Type <span className="text-red-600">*</span>
            </label>
            <select
              id="job-type"
              value={job.employment_type}
              disabled={busy}
              onChange={(e) => set('employment_type', e.target.value)}
              className={INPUT}
            >
              <option value="">Select a type…</option>
              {activeTypes.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}{!t.active ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
            <p className={HINT}>
              Need another? <Link href="/admin/job-locations" className="underline">Add one here</Link>.
            </p>
          </div>

          <div>
            <label className={LABEL} htmlFor="job-experience-level">Experience Level</label>
            <select
              id="job-experience-level"
              value={customExperience ? CUSTOM_OPTION : job.experience_level}
              disabled={busy}
              onChange={(e) => {
                if (e.target.value === CUSTOM_OPTION) {
                  setCustomExperience(true);
                  set('experience_level', '');
                } else {
                  setCustomExperience(false);
                  set('experience_level', e.target.value);
                }
              }}
              className={INPUT}
            >
              <option value="">Not specified</option>
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
              <option value={CUSTOM_OPTION}>Custom…</option>
            </select>
            {customExperience && (
              <input
                type="text"
                value={job.experience_level}
                disabled={busy}
                onChange={(e) => set('experience_level', e.target.value)}
                className={`${INPUT} mt-2`}
                placeholder="e.g. 2–4 years in farm machinery sales"
                maxLength={80}
                aria-label="Custom experience level"
                autoFocus
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="job-min-exp">Minimum Experience</label>
              <input
                id="job-min-exp"
                type="text"
                value={job.min_experience}
                disabled={busy}
                onChange={(e) => set('min_experience', e.target.value)}
                className={INPUT}
                placeholder="1 year"
                maxLength={40}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="job-max-exp">Maximum Experience</label>
              <input
                id="job-max-exp"
                type="text"
                value={job.max_experience}
                disabled={busy}
                onChange={(e) => set('max_experience', e.target.value)}
                className={INPUT}
                placeholder="3 years"
                maxLength={40}
              />
            </div>
          </div>

          {/* Locations */}
          <div className="md:col-span-2">
            <span className={LABEL}>
              Location(s) <span className="text-red-600">*</span>
            </span>
            {activeLocations.length === 0 ? (
              <Alert tone="warning">
                No locations yet. <Link href="/admin/job-locations" className="underline font-medium">Add a location</Link> first.
              </Alert>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-1">
                  {activeLocations.map((loc) => (
                    <label
                      key={loc.id}
                      className={`flex items-center gap-2 p-2.5 border rounded text-sm cursor-pointer transition-colors ${
                        job.location_ids.includes(loc.id)
                          ? 'border-gray-900 bg-gray-50 text-gray-900'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={job.location_ids.includes(loc.id)}
                        disabled={busy}
                        onChange={() => toggleLocation(loc.id)}
                        className="w-4 h-4"
                      />
                      <span className="truncate">{loc.name}{!loc.active ? ' (inactive)' : ''}</span>
                    </label>
                  ))}
                </div>
                <p className={HINT}>
                  {job.location_ids.length === 0
                    ? 'Select one or more towns.'
                    : job.location_ids.length === 1
                      ? '1 location selected. Applicants will see it prefilled.'
                      : `${job.location_ids.length} locations selected. Applicants choose their preferred one.`}
                </p>
              </>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Description */}
      <AdminCard title="Job Description">
        <div className="space-y-4">
          <div>
            <label className={LABEL} htmlFor="job-summary">Short Description</label>
            <textarea
              id="job-summary"
              value={job.summary}
              disabled={busy}
              onChange={(e) => set('summary', e.target.value)}
              rows={2}
              className={`${INPUT} resize-y`}
              maxLength={400}
            />
            <p className={HINT}>One or two lines. Shown on the job card in the openings list.</p>
          </div>

          <div>
            <label className={LABEL} htmlFor="job-summary-hi">Short Description (Hindi)</label>
            <textarea
              id="job-summary-hi"
              value={job.summary_hi}
              disabled={busy}
              onChange={(e) => set('summary_hi', e.target.value)}
              rows={2}
              className={`${INPUT} resize-y`}
              maxLength={400}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="job-description">Full Job Description</label>
            <textarea
              id="job-description"
              value={job.description}
              disabled={busy}
              onChange={(e) => set('description', e.target.value)}
              rows={6}
              className={`${INPUT} resize-y`}
            />
            <p className={HINT}>Appears as &ldquo;About the Role&rdquo; on the job page. Line breaks are preserved.</p>
          </div>

          <div>
            <label className={LABEL} htmlFor="job-description-hi">Full Job Description (Hindi)</label>
            <textarea
              id="job-description-hi"
              value={job.description_hi}
              disabled={busy}
              onChange={(e) => set('description_hi', e.target.value)}
              rows={4}
              className={`${INPUT} resize-y`}
            />
          </div>
        </div>
      </AdminCard>

      {/* Banner image */}
      <AdminCard title="Banner Image">
        <div className="space-y-4">
          <p className={HINT}>
            Shown across the top of the application page, after someone clicks Apply Now.
            Optional — leave it empty and the page keeps its plain heading.
          </p>

          <dl className="border border-gray-200 bg-gray-50 text-sm divide-y divide-gray-200">
            <div className="flex justify-between gap-4 px-4 py-2">
              <dt className="text-gray-600">Size</dt>
              <dd className="font-medium text-gray-900">
                {BANNER_WIDTH} × {BANNER_HEIGHT} px
              </dd>
            </div>
            <div className="flex justify-between gap-4 px-4 py-2">
              <dt className="text-gray-600">Shape</dt>
              <dd className="font-medium text-gray-900">16:9 widescreen</dd>
            </div>
            <div className="flex justify-between gap-4 px-4 py-2">
              <dt className="text-gray-600">Minimum width</dt>
              <dd className="font-medium text-gray-900">{BANNER_MIN_WIDTH} px</dd>
            </div>
            <div className="flex justify-between gap-4 px-4 py-2">
              <dt className="text-gray-600">File</dt>
              <dd className="font-medium text-gray-900">JPG, PNG or WebP · max {IMAGE_MAX_MB} MB</dd>
            </div>
          </dl>

          <p className={HINT}>
            This is the same shape as the banner on the homepage. Anything squarer, taller or
            smaller than the above is rejected — a portrait photo would have its middle cropped
            out and its subject lost.
          </p>

          {job.image_url ? (
            <div className="space-y-3">
              <div className="border border-gray-200 bg-gray-50 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.image_url}
                  alt="Job banner preview"
                  className="w-full max-h-56 object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <label className={`${BTN_SECONDARY} cursor-pointer`}>
                  {uploading ? 'Uploading…' : 'Replace image'}
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="sr-only"
                    disabled={busy || uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      // Reset so picking the same file twice still fires onChange.
                      e.target.value = '';
                      if (file) uploadImage(file);
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  disabled={busy || uploading}
                  onClick={() => set('image_url', '')}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label
              className={`${BTN_SECONDARY} cursor-pointer inline-flex ${uploading ? 'opacity-60' : ''}`}
            >
              {uploading ? 'Uploading…' : 'Choose an image'}
              <input
                type="file"
                accept={IMAGE_ACCEPT}
                className="sr-only"
                disabled={busy || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) uploadImage(file);
                }}
              />
            </label>
          )}
        </div>
      </AdminCard>

      {/* Lists */}
      <AdminCard title="Responsibilities, Requirements & Skills">
        <div className="space-y-6">
          <ListEditor
            label="Responsibilities"
            value={job.responsibilities}
            onChange={(next) => set('responsibilities', next)}
            placeholder="e.g. Manage daily sales activities"
            disabled={busy}
            hint="Each line becomes a bullet point on the job page."
          />
          <ListEditor
            label="Requirements"
            value={job.requirements}
            onChange={(next) => set('requirements', next)}
            placeholder="e.g. Own two-wheeler and valid licence"
            disabled={busy}
          />
          <ListEditor
            label="Skills"
            value={job.skills}
            onChange={(next) => set('skills', next)}
            placeholder="e.g. Tally / billing software"
            disabled={busy}
            hint="Shown as tags on the job page."
          />
          <div>
            <label className={LABEL} htmlFor="job-preferred">Preferred Qualifications</label>
            <textarea
              id="job-preferred"
              value={job.preferred_qualifications}
              disabled={busy}
              onChange={(e) => set('preferred_qualifications', e.target.value)}
              rows={3}
              className={`${INPUT} resize-y`}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="job-offer">What We Offer</label>
            <textarea
              id="job-offer"
              value={job.what_we_offer}
              disabled={busy}
              onChange={(e) => set('what_we_offer', e.target.value)}
              rows={3}
              className={`${INPUT} resize-y`}
            />
          </div>
        </div>
      </AdminCard>

      {/* Salary */}
      <AdminCard
        title="Salary"
        description="Entirely optional. Leave everything blank to publish without mentioning salary."
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={LABEL} htmlFor="job-salary-min">Minimum (₹)</label>
            <input
              id="job-salary-min"
              type="number"
              min={0}
              step={500}
              value={job.salary_min}
              disabled={busy}
              onChange={(e) => set('salary_min', e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="job-salary-max">Maximum (₹)</label>
            <input
              id="job-salary-max"
              type="number"
              min={0}
              step={500}
              value={job.salary_max}
              disabled={busy}
              onChange={(e) => set('salary_max', e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="job-salary-period">Period</label>
            <select
              id="job-salary-period"
              value={job.salary_period}
              disabled={busy}
              onChange={(e) => set('salary_period', e.target.value)}
              className={INPUT}
            >
              {Object.entries(SALARY_PERIODS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={job.salary_negotiable}
                disabled={busy}
                onChange={(e) => set('salary_negotiable', e.target.checked)}
                className="w-4 h-4"
              />
              Negotiable
            </label>
          </div>
        </div>
      </AdminCard>

      {/* Additional */}
      <AdminCard title="Additional Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL} htmlFor="job-deadline">Application Deadline</label>
            <input
              id="job-deadline"
              type="date"
              value={job.application_deadline}
              disabled={busy}
              onChange={(e) => set('application_deadline', e.target.value)}
              className={INPUT}
            />
            <p className={HINT}>
              Applications stop automatically at the end of this day (IST). Leave blank for no deadline.
            </p>
          </div>
          <div>
            <label className={LABEL} htmlFor="job-contact">Contact Information</label>
            <input
              id="job-contact"
              type="text"
              value={job.contact_info}
              disabled={busy}
              onChange={(e) => set('contact_info', e.target.value)}
              className={INPUT}
              placeholder="e.g. Call +91 7488095803, Mon–Sat"
              maxLength={200}
            />
            <p className={HINT}>Shown on the job page. Leave blank to hide.</p>
          </div>
          <div className="md:col-span-2">
            <label className={LABEL} htmlFor="job-notes">Custom Notes</label>
            <textarea
              id="job-notes"
              value={job.additional_notes}
              disabled={busy}
              onChange={(e) => set('additional_notes', e.target.value)}
              rows={3}
              className={`${INPUT} resize-y`}
            />
            <p className={HINT}>Anything else applicants should know. Shown in a highlighted box.</p>
          </div>
          <div>
            <label className={LABEL} htmlFor="job-seo-title">SEO Title</label>
            <input
              id="job-seo-title"
              type="text"
              value={job.seo_title}
              disabled={busy}
              onChange={(e) => set('seo_title', e.target.value)}
              className={INPUT}
              maxLength={120}
              placeholder="Leave blank to generate automatically"
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="job-seo-description">SEO Description</label>
            <input
              id="job-seo-description"
              type="text"
              value={job.seo_description}
              disabled={busy}
              onChange={(e) => set('seo_description', e.target.value)}
              className={INPUT}
              maxLength={200}
              placeholder="Leave blank to use the short description"
            />
          </div>
        </div>
      </AdminCard>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button type="button" onClick={() => handleSave('draft')} disabled={busy} className={BTN_SECONDARY}>
            {saving === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>

          <button type="button" onClick={() => handleSave('published')} disabled={busy} className={BTN_PRIMARY}>
            {saving === 'published' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {job.status === 'published' ? 'Save & Keep Published' : 'Publish'}
          </button>

          {id && job.status !== 'draft' && (
            <button type="button" onClick={() => handleSave('closed')} disabled={busy} className={BTN_SECONDARY}>
              {saving === 'closed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Close Job
            </button>
          )}

          <span className="text-xs text-gray-500 sm:ml-auto">
            Current status: <strong className="text-gray-700">{job.status}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
