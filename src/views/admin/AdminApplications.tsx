'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, Eye, ChevronLeft, ChevronRight, Download, Send, Loader2, X, AlertTriangle,
} from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import { APPLICATION_STATUSES, NOTIFICATION_STATUSES, formatDate } from '@/lib/types';
import type { JobApplication } from '@/lib/types';
import {
  AdminCard, Alert, PageHeading, StatusPill, TableScroll, TH, TD,
  INPUT, BTN_PRIMARY, BTN_SECONDARY,
} from '@/views/admin/ui';

interface FilterOptions {
  jobs: Array<{ id: string; title: string; status: string }>;
  categories: string[];
  locations: string[];
}

const PER_PAGE = 20;

export function AdminApplications() {
  const { token } = useAdminAuth();
  const searchParams = useSearchParams();

  const [apps, setApps] = useState<JobApplication[]>([]);
  const [options, setOptions] = useState<FilterOptions>({ jobs: [], categories: [], locations: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [jobId, setJobId] = useState(searchParams.get('job_id') || 'all');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);

    const params: Record<string, string> = { page: String(page), per_page: String(PER_PAGE) };
    if (appliedSearch) params.search = appliedSearch;
    if (status !== 'all') params.status = status;
    if (jobId !== 'all') params.job_id = jobId;
    if (category !== 'all') params.category = category;
    if (location !== 'all') params.location = location;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const result = await adminFetch('/admin-api/applications', { token, searchParams: params });
    if (result.ok) {
      setApps(result.data?.data || []);
      setTotal(result.data?.total || 0);
    } else {
      setLoadError('Unable to load applications. Please try again.');
    }
    setLoading(false);
  }, [token, page, appliedSearch, status, jobId, category, location, dateFrom, dateTo]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const result = await adminFetch('/admin-api/applications/filters', { token });
      if (result.ok) {
        setOptions({
          jobs: result.data?.jobs || [],
          categories: result.data?.categories || [],
          locations: result.data?.locations || [],
        });
      }
    })();
  }, [token]);

  // CVs are only fetched when asked for — the list never loads any file data.
  const downloadCv = async (app: JobApplication) => {
    if (!token) return;
    setBusyId(`cv-${app.id}`);
    setLoadError(null);
    const result = await adminFetch('/admin-api/applications/resume', { token, searchParams: { id: app.id } });
    setBusyId(null);
    if (result.ok && result.data?.url) {
      window.open(result.data.url, '_blank', 'noopener,noreferrer');
    } else {
      setLoadError(result.data?.error || 'Could not open that CV.');
    }
  };

  const resend = async (app: JobApplication) => {
    if (!token) return;
    setBusyId(`mail-${app.id}`);
    setNotice(null);
    setLoadError(null);
    const result = await adminFetch('/admin-api/applications/resend', {
      method: 'POST',
      body: { id: app.id },
      token,
    });
    setBusyId(null);
    if (result.ok) {
      setNotice(`Notification for ${app.full_name} sent.`);
      fetchApps();
    } else {
      setLoadError(result.data?.error || 'Could not resend the notification.');
      fetchApps();
    }
  };

  const changeStatus = async (app: JobApplication, next: string) => {
    if (!token) return;
    setBusyId(`status-${app.id}`);
    const result = await adminFetch('/admin-api/applications/update', {
      method: 'POST',
      body: { id: app.id, status: next },
      token,
    });
    setBusyId(null);
    if (result.ok) {
      setApps((prev) => prev.map((row) => (row.id === app.id ? { ...row, status: next } : row)));
    } else {
      setLoadError(result.data?.error || 'Could not update the status.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatus('all');
    setJobId('all');
    setCategory('all');
    setLocation('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const filtersActive =
    Boolean(appliedSearch) || status !== 'all' || jobId !== 'all' ||
    category !== 'all' || location !== 'all' || Boolean(dateFrom) || Boolean(dateTo);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const failedCount = apps.filter(
    (a) => a.notification_status === 'failed' || a.notification_status === 'skipped'
  ).length;

  return (
    <div className="space-y-4">
      <PageHeading title="Applications" subtitle={`${total} application${total === 1 ? '' : 's'} in total`} />

      {notice && <Alert tone="success" onDismiss={() => setNotice(null)}>{notice}</Alert>}
      {loadError && <Alert tone="error" onDismiss={() => setLoadError(null)}>{loadError}</Alert>}

      {failedCount > 0 && (
        <Alert tone="warning">
          <strong>{failedCount}</strong> application{failedCount === 1 ? '' : 's'} on this page were saved but their
          email notification did not go out. The applications and CVs are safe — use{' '}
          <span className="font-medium">Resend</span> once email is working.
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setAppliedSearch(search.trim().slice(0, 100));
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <label htmlFor="apps-search" className="sr-only">Search applications</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="apps-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone or job title…"
                maxLength={100}
                className={`${INPUT} pl-9`}
              />
            </div>

            <div>
              <label htmlFor="apps-job" className="sr-only">Filter by job</label>
              <select id="apps-job" value={jobId} onChange={(e) => { setJobId(e.target.value); setPage(1); }} className={INPUT}>
                <option value="all">All jobs</option>
                {options.jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="apps-status" className="sr-only">Filter by status</label>
              <select id="apps-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={INPUT}>
                <option value="all">All statuses</option>
                {Object.entries(APPLICATION_STATUSES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="apps-category" className="sr-only">Filter by category</label>
              <select id="apps-category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={INPUT}>
                <option value="all">All categories</option>
                {options.categories.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="apps-location" className="sr-only">Filter by location</label>
              <select id="apps-location" value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} className={INPUT}>
                <option value="all">All locations</option>
                {options.locations.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="apps-from" className="block text-xs text-gray-500 mb-1">From</label>
              <input id="apps-from" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={INPUT} />
            </div>

            <div>
              <label htmlFor="apps-to" className="block text-xs text-gray-500 mb-1">To</label>
              <input id="apps-to" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={INPUT} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
        <LoadingSpinner label="Loading applications…" />
      ) : apps.length === 0 ? (
        <AdminCard>
          <div className="py-10 text-center">
            <p className="text-gray-900 font-medium">
              {filtersActive ? 'No applications match these filters' : 'No applications received yet'}
            </p>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              {filtersActive
                ? 'Try clearing the filters to see everything.'
                : 'When candidates apply for your published jobs, their applications will appear here.'}
            </p>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className={BTN_SECONDARY}>
                <X className="w-4 h-4" /> Clear filters
              </button>
            )}
          </div>
        </AdminCard>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <TableScroll>
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={TH}>Date</th>
                  <th className={TH}>Applicant</th>
                  <th className={TH}>Position</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Location</th>
                  <th className={TH}>Contact</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Email</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apps.map((app) => {
                  const needsResend =
                    app.notification_status === 'failed' || app.notification_status === 'skipped';
                  return (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className={`${TD} whitespace-nowrap text-gray-500`}>{formatDate(app.created_at)}</td>
                      <td className={`${TD} font-medium text-gray-900`}>{app.full_name}</td>
                      <td className={TD}>{app.job_title_snapshot || app.job_slug || 'General Application'}</td>
                      <td className={TD}>{app.category_snapshot || <span className="text-gray-400">—</span>}</td>
                      <td className={TD}>{app.preferred_location || <span className="text-gray-400">—</span>}</td>
                      <td className={TD}>
                        <a href={`mailto:${app.email}`} className="block text-gray-700 hover:underline break-all">
                          {app.email}
                        </a>
                        <a href={`tel:${app.phone}`} className="block text-xs text-gray-500 hover:underline">
                          {app.phone}
                        </a>
                      </td>
                      <td className={TD}>
                        <label className="sr-only" htmlFor={`status-${app.id}`}>
                          Status for {app.full_name}
                        </label>
                        <select
                          id={`status-${app.id}`}
                          value={app.status}
                          disabled={busyId === `status-${app.id}`}
                          onChange={(e) => changeStatus(app, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:border-gray-900 focus:outline-none disabled:opacity-50"
                        >
                          {Object.entries(APPLICATION_STATUSES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className={TD}>
                        <StatusPill
                          kind="notification"
                          value={app.notification_status || 'pending'}
                          label={
                            NOTIFICATION_STATUSES[
                              (app.notification_status || 'pending') as keyof typeof NOTIFICATION_STATUSES
                            ] || app.notification_status
                          }
                        />
                      </td>
                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          {app.resume_url && (
                            <button
                              type="button"
                              onClick={() => downloadCv(app)}
                              disabled={busyId === `cv-${app.id}`}
                              className="p-2 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                              aria-label={`Download CV for ${app.full_name}`}
                              title="Download CV"
                            >
                              {busyId === `cv-${app.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => resend(app)}
                            disabled={busyId === `mail-${app.id}`}
                            className={`p-2 rounded disabled:opacity-50 ${
                              needsResend ? 'text-amber-700 hover:bg-amber-100' : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            aria-label={`Resend notification for ${app.full_name}`}
                            title={needsResend ? 'Notification failed — resend' : 'Resend notification'}
                          >
                            {busyId === `mail-${app.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : needsResend ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>

                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="p-2 rounded text-gray-600 hover:bg-gray-200"
                            aria-label={`View application from ${app.full_name}`}
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
