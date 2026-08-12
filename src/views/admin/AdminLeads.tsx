'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Download, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { LEAD_TYPES, LEAD_STATUSES, timeAgo } from '@/lib/types';
import type { Lead } from '@/lib/types';

export function AdminLeads() {
  const { token } = useAdminAuth();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [leadType, setLeadType] = useState(searchParams.get('lead_type') || 'all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const perPage = 20;

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const searchParamsObj: Record<string, string> = {
      page: String(page),
      per_page: String(perPage),
    };
    if (search) searchParamsObj.search = search;
    if (status !== 'all') searchParamsObj.status = status;
    if (leadType !== 'all') searchParamsObj.lead_type = leadType;

    const result = await adminFetch('/admin-api/leads', { token, searchParams: searchParamsObj });
    if (result.ok) {
      setLeads(result.data?.data || []);
      setTotal(result.data?.total || 0);
    }
    setLoading(false);
  }, [token, page, search, status, leadType]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleExport = async () => {
    if (!token) return;
    const params: Record<string, string> = {};
    if (status !== 'all') params.status = status;
    const result = await adminFetch('/admin-api/leads/export', { token, searchParams: params });
    if (result.ok && typeof result.data === 'string') {
      const blob = new Blob([result.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    const result = await adminFetch('/admin-api/leads/delete', { method: 'DELETE', body: { id }, token });
    if (result.ok) {
      setConfirmDelete(null);
      fetchLeads();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total leads</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm rounded hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, product…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {Object.entries(LEAD_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={leadType}
            onChange={(e) => { setLeadType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="all">All Types</option>
            {Object.entries(LEAD_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">
            Apply Filters
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner label="Loading leads…" />
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState
            title="No enquiries received yet"
            message="When visitors submit enquiries, callbacks, or RFQs, they will appear here."
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{timeAgo(lead.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{LEAD_TYPES[lead.lead_type as keyof typeof LEAD_TYPES] || lead.lead_type}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{lead.product_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">{LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES] || lead.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                          aria-label="View lead"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setConfirmDelete(lead.id)}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600"
                          aria-label="Delete lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
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

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this lead?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
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
