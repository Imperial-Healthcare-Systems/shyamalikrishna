'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Download, Trash2 } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { APPLICATION_STATUSES, formatDate, formatDateTime } from '@/lib/types';
import type { JobApplication } from '@/lib/types';

export function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const [app, setApp] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const fetchApp = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    const result = await adminFetch('/admin-api/applications/get', { token, searchParams: { id } });
    if (result.ok) {
      setApp(result.data.application);
    } else {
      setError(result.data?.error || 'Failed to load application');
    }
    setLoading(false);
  }, [token, id]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  const handleUpdate = async (field: string, value: string) => {
    if (!token || !app) return;
    setSaving(true);
    const result = await adminFetch('/admin-api/applications/update', {
      method: 'POST',
      body: { id: app.id, [field]: value },
      token,
    });
    if (result.ok) setApp(result.data.application);
    setSaving(false);
  };

  // The applications bucket is private; ask the edge function for a
  // short-lived signed URL at click time rather than storing a public one.
  const handleDownloadResume = async () => {
    if (!token || !app) return;
    setResumeError(null);
    setResumeLoading(true);
    const result = await adminFetch('/admin-api/applications/resume', {
      token,
      searchParams: { id: app.id },
    });
    setResumeLoading(false);
    if (result.ok && result.data?.url) {
      window.open(result.data.url, '_blank', 'noopener,noreferrer');
    } else {
      setResumeError(result.data?.error || 'Could not open resume.');
    }
  };

  const handleDelete = async () => {
    if (!token || !app) return;
    const result = await adminFetch('/admin-api/applications/delete', { method: 'DELETE', body: { id: app.id }, token });
    if (result.ok) {
      window.history.back();
    }
  };

  if (loading) return <LoadingSpinner label="Loading application…" />;
  if (error || !app) return <ErrorState message={error || 'Application not found'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/applications" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{app.full_name}</h1>
          <p className="text-sm text-gray-500">Applied {formatDateTime(app.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Full Name</dt>
                <dd className="font-medium text-gray-900">{app.full_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">
                  <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-blue-600"><Mail className="w-3.5 h-3.5" /> {app.email}</a>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">
                  <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-blue-600"><Phone className="w-3.5 h-3.5" /> {app.phone}</a>
                </dd>
              </div>
              {app.current_location && (
                <div>
                  <dt className="text-gray-500">Current Location</dt>
                  <dd className="font-medium text-gray-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {app.current_location}</dd>
                </div>
              )}
              {app.highest_qualification && (
                <div>
                  <dt className="text-gray-500">Highest Qualification</dt>
                  <dd className="font-medium text-gray-900">{app.highest_qualification}</dd>
                </div>
              )}
              {app.years_of_experience && (
                <div>
                  <dt className="text-gray-500">Years of Experience</dt>
                  <dd className="font-medium text-gray-900">{app.years_of_experience}</dd>
                </div>
              )}
            </dl>
          </div>

          {app.cover_letter && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Cover Letter</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{app.cover_letter}</p>
            </div>
          )}

          {(app.linkedin_url || app.portfolio_url) && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Links</h2>
              <div className="space-y-2 text-sm">
                {app.linkedin_url && (
                  <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-700">{app.linkedin_url}</a>
                )}
                {app.portfolio_url && (
                  <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-700">{app.portfolio_url}</a>
                )}
              </div>
            </div>
          )}

          {app.resume_url && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Resume</h2>
              <button
                type="button"
                onClick={handleDownloadResume}
                disabled={resumeLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {resumeLoading ? 'Preparing…' : app.resume_filename || 'Download resume'}
              </button>
              {resumeError && <p className="mt-2 text-sm text-red-600">{resumeError}</p>}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Application Status</h2>
            <select
              value={app.status}
              onChange={(e) => handleUpdate('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
            >
              {Object.entries(APPLICATION_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {saving && <p className="text-xs text-gray-400 mt-2">Saving…</p>}
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Internal Notes</h2>
            <textarea
              value={app.internal_notes || ''}
              onChange={(e) => setApp({ ...app, internal_notes: e.target.value })}
              onBlur={(e) => handleUpdate('internal_notes', e.target.value)}
              rows={5}
              placeholder="Add internal notes…"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none resize-y"
            />
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Meta</h2>
            <dl className="space-y-2 text-xs">
              <div><dt className="text-gray-500 inline">Position: </dt><dd className="text-gray-900 inline">{app.job_slug || 'General Application'}</dd></div>
              <div><dt className="text-gray-500 inline">Applied: </dt><dd className="text-gray-900 inline">{formatDate(app.created_at)}</dd></div>
              <div><dt className="text-gray-500 inline">ID: </dt><dd className="text-gray-900 inline font-mono">{app.id}</dd></div>
            </dl>
          </div>

          <button onClick={() => setConfirmDelete(true)} className="w-full px-4 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete Application
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this application?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
