'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Mail, Phone, MapPin, Download, Trash2, Send, Loader2, Home, Briefcase,
} from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import {
  APPLICATION_STATUSES, NOTIFICATION_STATUSES, formatDate, formatDateTime,
} from '@/lib/types';
import type { JobApplication } from '@/lib/types';
import {
  AdminCard, Alert, ConfirmDialog, StatusPill,
  INPUT, BTN_SECONDARY, BTN_DANGER_GHOST,
} from '@/views/admin/ui';

export function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const router = useRouter();

  const [app, setApp] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const [mailBusy, setMailBusy] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchApp = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    const result = await adminFetch('/admin-api/applications/get', { token, searchParams: { id } });
    if (result.ok) {
      setApp(result.data.application);
      setNotes(result.data.application?.internal_notes || '');
    } else {
      setError(result.data?.error || 'Unable to load this application.');
    }
    setLoading(false);
  }, [token, id]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  const update = async (field: 'status' | 'internal_notes', value: string) => {
    if (!token || !app) return;
    setSaving(true);
    setError(null);
    const result = await adminFetch('/admin-api/applications/update', {
      method: 'POST',
      body: { id: app.id, [field]: value },
      token,
    });
    setSaving(false);
    if (result.ok) {
      setApp(result.data.application);
    } else {
      setError(result.data?.error || 'Could not save that change.');
    }
  };

  /**
   * The bucket is private. Ask the server for a short-lived signed URL at click
   * time so the storage path is never exposed and old links stop working.
   */
  const downloadCv = async () => {
    if (!token || !app) return;
    setCvBusy(true);
    setError(null);
    const result = await adminFetch('/admin-api/applications/resume', { token, searchParams: { id: app.id } });
    setCvBusy(false);
    if (result.ok && result.data?.url) {
      window.open(result.data.url, '_blank', 'noopener,noreferrer');
    } else {
      setError(result.data?.error || 'Could not open the CV.');
    }
  };

  const resend = async () => {
    if (!token || !app) return;
    setMailBusy(true);
    setError(null);
    setNotice(null);
    const result = await adminFetch('/admin-api/applications/resend', {
      method: 'POST',
      body: { id: app.id },
      token,
    });
    setMailBusy(false);
    if (result.ok) {
      setNotice('Notification email sent.');
    } else {
      setError(result.data?.error || 'Could not send the notification.');
    }
    fetchApp();
  };

  const remove = async () => {
    if (!token || !app) return;
    setDeleteBusy(true);
    const result = await adminFetch('/admin-api/applications/delete', {
      method: 'DELETE',
      body: { id: app.id },
      token,
    });
    setDeleteBusy(false);
    if (result.ok) {
      router.push('/admin/applications');
    } else {
      setError(result.data?.error || 'Could not delete this application.');
      setConfirmDelete(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading application…" />;
  if (!app) return <ErrorState message={error || 'Application not found.'} />;

  const notificationStatus = app.notification_status || 'pending';
  const needsResend = notificationStatus === 'failed' || notificationStatus === 'skipped';

  const applicantRows: Array<{ icon?: React.ReactNode; label: string; value: React.ReactNode }> = [
    { label: 'Full name', value: app.full_name },
    {
      icon: <Mail className="w-3.5 h-3.5" />,
      label: 'Email',
      value: <a href={`mailto:${app.email}`} className="hover:underline break-all">{app.email}</a>,
    },
    {
      icon: <Phone className="w-3.5 h-3.5" />,
      label: 'Phone',
      value: <a href={`tel:${app.phone}`} className="hover:underline">{app.phone}</a>,
    },
  ];
  if (app.preferred_location) {
    applicantRows.push({
      icon: <MapPin className="w-3.5 h-3.5" />,
      label: 'Preferred location',
      value: app.preferred_location,
    });
  }
  if (app.years_of_experience) {
    applicantRows.push({
      icon: <Briefcase className="w-3.5 h-3.5" />,
      label: 'Experience',
      value: app.years_of_experience,
    });
  }
  if (app.address) {
    applicantRows.push({ icon: <Home className="w-3.5 h-3.5" />, label: 'Address', value: app.address });
  }
  if (app.highest_qualification) {
    applicantRows.push({ label: 'Highest qualification', value: app.highest_qualification });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/applications" className="p-2 hover:bg-gray-100 rounded shrink-0 mt-1" aria-label="Back to applications">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{app.full_name}</h1>
          <p className="text-sm text-gray-500">
            Applied for <strong>{app.job_title_snapshot || app.job_slug || 'General Application'}</strong>
            {' · '}
            {formatDateTime(app.created_at)}
          </p>
        </div>
      </div>

      {notice && <Alert tone="success" onDismiss={() => setNotice(null)}>{notice}</Alert>}
      {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {needsResend && (
        <Alert tone="warning">
          This application was saved successfully, but the notification email{' '}
          {notificationStatus === 'skipped' ? 'was never sent because email is not configured' : 'failed to send'}.
          Nothing has been lost — use <strong>Resend notification</strong> below once email is working.
          {app.notification_error && (
            <span className="block mt-1 text-xs opacity-80">Last error: {app.notification_error}</span>
          )}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Applicant">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {applicantRows.map((row, index) => (
                <div key={index} className={row.label === 'Address' ? 'sm:col-span-2' : undefined}>
                  <dt className="text-gray-500 flex items-center gap-1.5">
                    {row.icon}
                    {row.label}
                  </dt>
                  <dd className="font-medium text-gray-900 mt-0.5 whitespace-pre-line">{row.value}</dd>
                </div>
              ))}
            </dl>
          </AdminCard>

          <AdminCard title="Position applied for">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Position</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {app.job_id && app.job_slug ? (
                    <Link href={`/careers/${app.job_slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {app.job_title_snapshot || app.job_slug}
                    </Link>
                  ) : (
                    app.job_title_snapshot || 'General Application'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{app.category_snapshot || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{app.preferred_location || '—'}</dd>
              </div>
            </dl>
            {!app.job_id && app.job_title_snapshot && app.job_title_snapshot !== 'General Application' && (
              <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                The original job posting has since been deleted. The position recorded above is the one this
                candidate actually applied for.
              </p>
            )}
          </AdminCard>

          {app.cover_letter && (
            <AdminCard title="Cover note">
              {/* React escapes this — pasted markup renders as text, not HTML. */}
              <p className="text-sm text-gray-700 whitespace-pre-line break-words">{app.cover_letter}</p>
            </AdminCard>
          )}

          <AdminCard title="CV / Resume">
            {app.resume_url ? (
              <>
                <button type="button" onClick={downloadCv} disabled={cvBusy} className={BTN_SECONDARY}>
                  {cvBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {cvBusy ? 'Preparing…' : `Download ${app.resume_filename || 'CV'}`}
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  CVs are stored privately. This creates a link that expires after five minutes and is not
                  publicly accessible.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No CV on file for this application.</p>
            )}
          </AdminCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AdminCard title="Application status">
            <label htmlFor="app-status" className="sr-only">Application status</label>
            <select
              id="app-status"
              value={app.status}
              disabled={saving}
              onChange={(e) => update('status', e.target.value)}
              className={INPUT}
            >
              {Object.entries(APPLICATION_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {saving && <p className="text-xs text-gray-400 mt-2">Saving…</p>}
          </AdminCard>

          <AdminCard title="Email notification">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-600">Status</span>
              <StatusPill
                kind="notification"
                value={notificationStatus}
                label={
                  NOTIFICATION_STATUSES[notificationStatus as keyof typeof NOTIFICATION_STATUSES] ||
                  notificationStatus
                }
              />
            </div>
            {app.notification_attempts > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {app.notification_attempts} attempt{app.notification_attempts === 1 ? '' : 's'}
                {app.notification_last_attempt_at && `, last ${formatDateTime(app.notification_last_attempt_at)}`}
              </p>
            )}
            <button type="button" onClick={resend} disabled={mailBusy} className={`${BTN_SECONDARY} w-full mt-4`}>
              {mailBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {mailBusy ? 'Sending…' : 'Resend notification'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Resending only sends the email again — it never creates another application record.
            </p>
          </AdminCard>

          <AdminCard title="Internal notes">
            <label htmlFor="app-notes" className="sr-only">Internal notes</label>
            <textarea
              id="app-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (app.internal_notes || '')) update('internal_notes', notes);
              }}
              rows={5}
              maxLength={5000}
              placeholder="Interview notes, follow-up reminders…"
              className={`${INPUT} resize-y`}
            />
            <p className="text-xs text-gray-500 mt-1">Saved when you click away. Never shown to the applicant.</p>
          </AdminCard>

          <AdminCard title="Record">
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-gray-500 inline">Applied: </dt>
                <dd className="text-gray-900 inline">{formatDate(app.created_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 inline">Last updated: </dt>
                <dd className="text-gray-900 inline">{formatDateTime(app.updated_at)}</dd>
              </div>
              <div className="break-all">
                <dt className="text-gray-500 inline">Application ID: </dt>
                <dd className="text-gray-900 inline font-mono">{app.id}</dd>
              </div>
            </dl>
          </AdminCard>

          <button type="button" onClick={() => setConfirmDelete(true)} className={`${BTN_DANGER_GHOST} w-full`}>
            <Trash2 className="w-4 h-4" /> Delete application
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        busy={deleteBusy}
        title="Delete this application?"
        message={`${app.full_name}'s application will be permanently removed.`}
        consequence="Their CV is deleted from storage at the same time. This cannot be undone — consider setting the status to Rejected instead, which keeps the record."
        confirmLabel="Delete permanently"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
