import type { Job, JobLocation } from '@/lib/types';

/**
 * Shared shaping for job records.
 *
 * Locations hang off a join table, so PostgREST returns them nested two levels
 * deep and inconsistently (an object when the relationship resolves to one row,
 * an array when it resolves to many). Both the server fetches in lib/data.ts
 * and the client hooks in lib/hooks.ts run rows through here so every view can
 * just read `job.locations`.
 */

export const JOB_SELECT =
  '*, category:job_categories(id, name, name_hi, slug, active), job_location_map(job_locations(id, name, name_hi, slug, active, display_order))';

type Nested<T> = T | T[] | null | undefined;

function first<T>(value: Nested<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function normalizeJob(row: Record<string, unknown> | null | undefined): Job | null {
  if (!row) return null;

  const rawMap = (row.job_location_map as Array<{ job_locations: Nested<JobLocation> }> | undefined) || [];
  const locations = rawMap
    .map((entry) => first(entry?.job_locations))
    .filter((loc): loc is JobLocation => Boolean(loc))
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const { job_location_map: _discard, ...rest } = row as Record<string, unknown>;

  return {
    ...(rest as unknown as Job),
    category: first(row.category as Nested<Job['category']>) ?? null,
    locations,
  };
}

export function normalizeJobs(rows: Array<Record<string, unknown>> | null | undefined): Job[] {
  return (rows || []).map(normalizeJob).filter((job): job is Job => Boolean(job));
}

/** "Kashichak, Nawada, Roh" — falls back to the denormalised snapshot column. */
export function locationNames(job: Job): string[] {
  if (job.locations && job.locations.length > 0) return job.locations.map((l) => l.name);
  if (job.location) return job.location.split(',').map((part) => part.trim()).filter(Boolean);
  return [];
}

export function categoryName(job: Job): string | null {
  return job.category?.name || job.department || null;
}

/**
 * Experience as one readable phrase, from whichever of the three fields the
 * admin filled in. Returns null when none of them were, so callers can hide
 * the row rather than print an empty label.
 */
export function experienceLabel(job: Job): string | null {
  if (job.experience && job.experience.trim()) return job.experience.trim();

  const min = job.min_experience?.trim();
  const max = job.max_experience?.trim();
  if (min && max) return `${min} – ${max}`;
  if (min) return `${min}+`;
  if (max) return `Up to ${max}`;

  if (job.experience_level && job.experience_level.trim()) return job.experience_level.trim();
  return null;
}

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/**
 * Salary is optional throughout — many dealerships deliberately do not publish
 * it. Returns null unless the admin actually entered something.
 */
export function salaryLabel(job: Job): string | null {
  const period = job.salary_period ? ` ${job.salary_period}` : '';
  const hasMin = job.salary_min !== null && job.salary_min !== undefined;
  const hasMax = job.salary_max !== null && job.salary_max !== undefined;

  if (hasMin && hasMax) {
    const range = `₹${INR.format(Number(job.salary_min))} – ₹${INR.format(Number(job.salary_max))}${period}`;
    return job.salary_negotiable ? `${range} (negotiable)` : range;
  }
  if (hasMin) {
    const value = `From ₹${INR.format(Number(job.salary_min))}${period}`;
    return job.salary_negotiable ? `${value} (negotiable)` : value;
  }
  if (hasMax) {
    const value = `Up to ₹${INR.format(Number(job.salary_max))}${period}`;
    return job.salary_negotiable ? `${value} (negotiable)` : value;
  }
  if (job.salary_negotiable) return 'Negotiable';
  if (job.salary_type && job.salary_type.trim()) return job.salary_type.trim();
  return null;
}
