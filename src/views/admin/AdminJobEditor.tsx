'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import { JOB_STATUSES, slugify } from '@/lib/types';
import type { Job } from '@/lib/types';

const emptyJob: Partial<Job> = {
  title: '',
  slug: '',
  department: '',
  location: '',
  employment_type: '',
  experience: '',
  summary: '',
  responsibilities: '',
  requirements: '',
  preferred_qualifications: '',
  what_we_offer: '',
  application_deadline: '',
  status: 'draft',
};

export function AdminJobEditor() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const router = useRouter();
  const [job, setJob] = useState<Partial<Job>>(emptyJob);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      const result = await adminFetch('/admin-api/jobs/get', { token, searchParams: { id } });
      if (result.ok) {
        setJob(result.data.job);
      } else {
        setError('Failed to load job');
      }
      setLoading(false);
    })();
  }, [token, id]);

  const handleSave = async (publishStatus?: string) => {
    if (!token) return;
    setSaving(true);
    setError(null);

    const data: Partial<Job> = {
      ...job,
      status: publishStatus || job.status,
    };

    if (!data.title || !data.slug) {
      setError('Title and slug are required');
      setSaving(false);
      return;
    }

    if (data.application_deadline === '') data.application_deadline = null;

    const result = await adminFetch('/admin-api/jobs/save', {
      method: 'POST',
      body: { id: id || undefined, ...data },
      token,
    });

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/jobs');
      }, 1000);
    } else {
      setError(result.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner label="Loading job…" />;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/jobs" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Job' : 'New Job'}</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">Saved successfully. Redirecting…</div>}

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Job Title *</label>
            <input type="text" value={job.title || ''} onChange={(e) => {
              setJob({ ...job, title: e.target.value, slug: job.slug || slugify(e.target.value) });
            }} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Slug *</label>
            <input type="text" value={job.slug || ''} onChange={(e) => setJob({ ...job, slug: slugify(e.target.value) })} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Department</label>
            <input type="text" value={job.department || ''} onChange={(e) => setJob({ ...job, department: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input type="text" value={job.location || ''} onChange={(e) => setJob({ ...job, location: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Employment Type</label>
            <input type="text" value={job.employment_type || ''} onChange={(e) => setJob({ ...job, employment_type: e.target.value })} className={inputClass} placeholder="Full-time, Part-time, Contract" />
          </div>
          <div>
            <label className={labelClass}>Experience</label>
            <input type="text" value={job.experience || ''} onChange={(e) => setJob({ ...job, experience: e.target.value })} className={inputClass} placeholder="e.g. 2-3 years" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Summary</label>
          <textarea value={job.summary || ''} onChange={(e) => setJob({ ...job, summary: e.target.value })} rows={2} className={`${inputClass} resize-y`} />
        </div>

        <div>
          <label className={labelClass}>Responsibilities (one per line)</label>
          <textarea value={job.responsibilities || ''} onChange={(e) => setJob({ ...job, responsibilities: e.target.value })} rows={5} className={`${inputClass} resize-y font-mono text-xs`} />
        </div>

        <div>
          <label className={labelClass}>Requirements (one per line)</label>
          <textarea value={job.requirements || ''} onChange={(e) => setJob({ ...job, requirements: e.target.value })} rows={5} className={`${inputClass} resize-y font-mono text-xs`} />
        </div>

        <div>
          <label className={labelClass}>Preferred Qualifications</label>
          <textarea value={job.preferred_qualifications || ''} onChange={(e) => setJob({ ...job, preferred_qualifications: e.target.value })} rows={3} className={`${inputClass} resize-y`} />
        </div>

        <div>
          <label className={labelClass}>What We Offer</label>
          <textarea value={job.what_we_offer || ''} onChange={(e) => setJob({ ...job, what_we_offer: e.target.value })} rows={3} className={`${inputClass} resize-y`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Application Deadline</label>
            <input type="date" value={job.application_deadline || ''} onChange={(e) => setJob({ ...job, application_deadline: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={job.status || 'draft'} onChange={(e) => setJob({ ...job, status: e.target.value })} className={inputClass}>
              {Object.entries(JOB_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button onClick={() => handleSave('draft')} disabled={saving} className="px-4 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50 disabled:opacity-50">
            Save as Draft
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
