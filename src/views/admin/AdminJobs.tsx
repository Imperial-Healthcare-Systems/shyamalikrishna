'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2, Eye, Edit } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { JOB_STATUSES, formatDate } from '@/lib/types';
import type { Job } from '@/lib/types';

export function AdminJobs() {
  const { token } = useAdminAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string> = { per_page: '100' };
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    const result = await adminFetch('/admin-api/jobs', { token, searchParams: params });
    if (result.ok) {
      setJobs(result.data?.data || []);
      setTotal(result.data?.total || 0);
    }
    setLoading(false);
  }, [token, search, status]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    const result = await adminFetch('/admin-api/jobs/delete', { method: 'DELETE', body: { id }, token });
    if (result.ok) {
      setConfirmDelete(null);
      fetchJobs();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total jobs</p>
        </div>
        <Link href="/admin/jobs/new" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700">
          <Plus className="w-4 h-4" /> New Job
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <form onSubmit={(e) => { e.preventDefault(); fetchJobs(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {Object.entries(JOB_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">Search</button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading jobs…" />
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState title="No jobs yet" message="Create your first job posting to attract candidates." />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{job.title}</td>
                    <td className="px-4 py-3 text-gray-600">{job.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{job.location || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                        job.status === 'published' ? 'bg-green-100 text-green-700' :
                        job.status === 'archived' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {JOB_STATUSES[job.status as keyof typeof JOB_STATUSES] || job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{job.published_at ? formatDate(job.published_at) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/careers/${job.slug}`} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" aria-label="View job">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/jobs/${job.id}`} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" aria-label="Edit job">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setConfirmDelete(job.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600" aria-label="Delete job">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this job?</h3>
            <p className="text-sm text-gray-600 mb-4">This will also remove associated applications. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
