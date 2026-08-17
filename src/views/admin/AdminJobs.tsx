'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Trash2, Eye, Pencil, Send, EyeOff, XCircle, Loader2, Users, X,
} from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import { JOB_STATUSES, formatDate, isDeadlinePassed } from '@/lib/types';
import type { Job } from '@/lib/types';
import {
  AdminCard, Alert, ConfirmDialog, PageHeading, StatusPill, TableScroll, TH, TD,
  INPUT, BTN_PRIMARY, BTN_SECONDARY,
} from '@/views/admin/ui';

type JobRow = Job & { application_count?: number; location_ids?: string[] };
interface Option { id: string; name: string }

export function AdminJobs() {
  const { token } = useAdminAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [locationId, setLocationId] = useState('all');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobRow | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);

    const params: Record<string, string> = { per_page: '100' };
    if (appliedSearch) params.search = appliedSearch;
    if (status !== 'all') params.status = status;
    if (categoryId !== 'all') params.category_id = categoryId;
    if (locationId !== 'all') params.location_id = locationId;

    const result = await adminFetch('/admin-api/jobs', { token, searchParams: params });
    if (result.ok) {
      setJobs(result.data?.data || []);
      setTotal(result.data?.total ?? (result.data?.data || []).length);
    } else {
      setLoadError('Unable to load jobs. Please try again.');
    }
    setLoading(false);
  }, [token, appliedSearch, status, categoryId, locationId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [cats, locs] = await Promise.all([
        adminFetch('/admin-api/job-categories', { token }),
        adminFetch('/admin-api/job-locations', { token }),
      ]);
      if (cats.ok) setCategories(cats.data?.data || []);
      if (locs.ok) setLocations(locs.data?.data || []);
    })();
  }, [token]);

  const changeStatus = async (job: JobRow, next: string) => {
    if (!token) return;
    setBusyId(job.id);
    setNotice(null);
    setLoadError(null);

    const result = await adminFetch('/admin-api/jobs/status', {
      method: 'POST',
      body: { id: job.id, status: next },
      token,
    });
    setBusyId(null);

    if (result.ok) {
      setNotice(`"${job.title}" is now ${next}.`);
      fetchJobs();
    } else {
      setLoadError(result.data?.error || 'Could not update this job.');
    }
  };

  const askDelete = (job: JobRow) => {
    setDeleteWarning(null);
    setDeleteTarget(job);
  };

  const confirmDelete = async (force: boolean) => {
    if (!token || !deleteTarget) return;
    setDeleteBusy(true);

    const result = await adminFetch('/admin-api/jobs/delete', {
      method: 'DELETE',
      body: { id: deleteTarget.id, confirm: force },
      token,
    });
    setDeleteBusy(false);

    if (result.ok) {
      const kept = result.data?.retained_applications || 0;
      setNotice(
        kept > 0
          ? `"${deleteTarget.title}" deleted. ${kept} application${kept === 1 ? '' : 's'} kept in Applications.`
          : `"${deleteTarget.title}" deleted.`
      );
      setDeleteTarget(null);
      setDeleteWarning(null);
      fetchJobs();
      return;
    }

    // 409 with requires_confirmation means the job has applications — surface
    // the count and offer closing instead.
    setDeleteWarning(result.data?.error || 'Could not delete this job.');
  };

  const clearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatus('all');
    setCategoryId('all');
    setLocationId('all');
  };

  const filtersActive =
    Boolean(appliedSearch) || status !== 'all' || categoryId !== 'all' || locationId !== 'all';

  const deleteHasApplications = (deleteTarget?.application_count || 0) > 0;

  return (
    <div className="space-y-4">
      <PageHeading
        title="Jobs"
        subtitle={`${total} job${total === 1 ? '' : 's'} in total`}
        actions={
          <Link href="/admin/jobs/new" className={BTN_PRIMARY}>
            <Plus className="w-4 h-4" /> Create Job
          </Link>
        }
      />

      {notice && <Alert tone="success" onDismiss={() => setNotice(null)}>{notice}</Alert>}
      {loadError && <Alert tone="error" onDismiss={() => setLoadError(null)}>{loadError}</Alert>}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedSearch(search.trim().slice(0, 100));
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <div className="relative lg:col-span-2">
            <label htmlFor="jobs-search" className="sr-only">Search jobs by title</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id="jobs-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job title…"
              maxLength={100}
              className={`${INPUT} pl-9`}
            />
          </div>

          <div>
            <label htmlFor="jobs-status" className="sr-only">Filter by status</label>
            <select id="jobs-status" value={status} onChange={(e) => setStatus(e.target.value)} className={INPUT}>
              <option value="all">All statuses</option>
              {Object.entries(JOB_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="jobs-category" className="sr-only">Filter by category</label>
            <select id="jobs-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={INPUT}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="jobs-location" className="sr-only">Filter by location</label>
            <select id="jobs-location" value={locationId} onChange={(e) => setLocationId(e.target.value)} className={INPUT}>
              <option value="all">All locations</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap gap-2">
            <button type="submit" className={BTN_PRIMARY}>Search</button>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className={BTN_SECONDARY}>
                <X className="w-4 h-4" /> Clear filters
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading jobs…" />
      ) : jobs.length === 0 ? (
        <AdminCard>
          <div className="py-10 text-center">
            <p className="text-gray-900 font-medium">
              {filtersActive ? 'No jobs match these filters' : 'No jobs yet'}
            </p>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              {filtersActive
                ? 'Try clearing the filters to see everything.'
                : 'Create your first vacancy to start receiving applications.'}
            </p>
            {filtersActive ? (
              <button type="button" onClick={clearFilters} className={BTN_SECONDARY}>
                <X className="w-4 h-4" /> Clear filters
              </button>
            ) : (
              <Link href="/admin/jobs/new" className={BTN_PRIMARY}>
                <Plus className="w-4 h-4" /> Create Job
              </Link>
            )}
          </div>
        </AdminCard>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <TableScroll>
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={TH}>Job Title</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Location</th>
                  <th className={TH}>Vacancies</th>
                  <th className={TH}>Applications</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Posted</th>
                  <th className={TH}>Deadline</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => {
                  const expired = isDeadlinePassed(job.application_deadline);
                  const places = (job.locations || []).map((l) => l.name);
                  const rowBusy = busyId === job.id;

                  return (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className={`${TD} font-medium text-gray-900`}>
                        {job.title}
                        <span className="block text-xs text-gray-400 font-normal">/{job.slug}</span>
                      </td>
                      <td className={TD}>{job.category?.name || job.department || '—'}</td>
                      <td className={TD}>
                        {places.length === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : places.length <= 2 ? (
                          places.join(', ')
                        ) : (
                          <span title={places.join(', ')}>
                            {places.slice(0, 2).join(', ')} +{places.length - 2}
                          </span>
                        )}
                      </td>
                      <td className={TD}>{job.vacancies ?? '—'}</td>
                      <td className={TD}>
                        {job.application_count ? (
                          <Link
                            href={`/admin/applications?job_id=${job.id}`}
                            className="inline-flex items-center gap-1 font-medium text-gray-900 hover:underline"
                          >
                            <Users className="w-3.5 h-3.5" /> {job.application_count}
                          </Link>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className={TD}>
                        <StatusPill
                          kind="job"
                          value={job.status}
                          label={JOB_STATUSES[job.status as keyof typeof JOB_STATUSES] || job.status}
                        />
                      </td>
                      <td className={TD}>{job.published_at ? formatDate(job.published_at) : '—'}</td>
                      <td className={TD}>
                        {job.application_deadline ? (
                          <span className={expired ? 'text-red-600' : ''}>
                            {formatDate(job.application_deadline)}
                            {expired && <span className="block text-xs">expired</span>}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          {job.status !== 'draft' && (
                            <Link
                              href={`/careers/${job.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded text-gray-600 hover:bg-gray-200"
                              aria-label={`View ${job.title} on the public site`}
                              title="View on site"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}

                          <Link
                            href={`/admin/jobs/${job.id}`}
                            className="p-2 rounded text-gray-600 hover:bg-gray-200"
                            aria-label={`Edit ${job.title}`}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          {job.status !== 'published' ? (
                            <button
                              type="button"
                              onClick={() => changeStatus(job, 'published')}
                              disabled={rowBusy}
                              className="p-2 rounded text-green-700 hover:bg-green-100 disabled:opacity-50"
                              aria-label={`Publish ${job.title}`}
                              title="Publish"
                            >
                              {rowBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => changeStatus(job, 'draft')}
                              disabled={rowBusy}
                              className="p-2 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                              aria-label={`Unpublish ${job.title}`}
                              title="Unpublish (back to draft)"
                            >
                              {rowBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          )}

                          {job.status !== 'closed' && (
                            <button
                              type="button"
                              onClick={() => changeStatus(job, 'closed')}
                              disabled={rowBusy}
                              className="p-2 rounded text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                              aria-label={`Close ${job.title}`}
                              title="Close — stops accepting applications"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => askDelete(job)}
                            className="p-2 rounded text-red-600 hover:bg-red-100"
                            aria-label={`Delete ${job.title}`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        busy={deleteBusy}
        title={`Delete "${deleteTarget?.title}"?`}
        message={
          deleteHasApplications
            ? undefined
            : 'This job has no applications, so deleting it is safe. This cannot be undone.'
        }
        consequence={
          deleteHasApplications
            ? `This job has ${deleteTarget?.application_count} application${deleteTarget?.application_count === 1 ? '' : 's'}. Closing it instead keeps the vacancy and its applications on record while immediately stopping new submissions — that is almost always what you want.`
            : undefined
        }
        confirmLabel={deleteHasApplications ? 'Delete anyway' : 'Delete job'}
        onConfirm={() => confirmDelete(deleteHasApplications)}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteWarning(null);
        }}
      >
        {deleteWarning && <Alert tone="error">{deleteWarning}</Alert>}
        {deleteHasApplications && (
          <>
            <p className="text-xs text-gray-500 mt-2">
              Applications are never deleted with the job — they stay in Applications with the job title recorded on them.
            </p>
            {deleteTarget?.status !== 'closed' && (
              <button
                type="button"
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  setDeleteWarning(null);
                  if (target) await changeStatus(target, 'closed');
                }}
                className={`${BTN_SECONDARY} w-full mt-3`}
              >
                <XCircle className="w-4 h-4" /> Close the job instead
              </button>
            )}
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
