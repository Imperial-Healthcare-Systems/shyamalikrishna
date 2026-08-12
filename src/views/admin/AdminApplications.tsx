'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { APPLICATION_STATUSES, formatDate } from '@/lib/types';
import type { JobApplication } from '@/lib/types';

export function AdminApplications() {
  const { token } = useAdminAuth();
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const perPage = 20;

  const fetchApps = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    const result = await adminFetch('/admin-api/applications', { token, searchParams: params });
    if (result.ok) {
      setApps(result.data?.data || []);
      setTotal(result.data?.total || 0);
    }
    setLoading(false);
  }, [token, page, search, status]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total applications</p>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchApps(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none">
            <option value="all">All Statuses</option>
            {Object.entries(APPLICATION_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">Search</button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading applications…" />
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState title="No applications received yet" message="When candidates apply for your jobs, their applications will appear here." />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Position</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(app.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{app.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{app.job_slug || 'General'}</td>
                    <td className="px-4 py-3 text-gray-600">{app.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                        {APPLICATION_STATUSES[app.status as keyof typeof APPLICATION_STATUSES] || app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/applications/${app.id}`} className="inline-flex p-1.5 hover:bg-gray-200 rounded text-gray-600" aria-label="View application">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50" aria-label="Previous page">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50" aria-label="Next page">
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
