'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, MapPin, Save, Trash2, MessageSquare } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { LEAD_TYPES, LEAD_STATUSES, LEAD_PRIORITIES, formatDateTime } from '@/lib/types';
import type { Lead, LeadNote } from '@/lib/types';

export function AdminLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchLead = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    const result = await adminFetch('/admin-api/leads/get', { token, searchParams: { id } });
    if (result.ok) {
      setLead(result.data.lead);
      setNotes(result.data.notes || []);
    } else {
      setError(result.data?.error || 'Failed to load lead');
    }
    setLoading(false);
  }, [token, id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleUpdate = async (field: string, value: string) => {
    if (!token || !lead) return;
    setSaving(true);
    const result = await adminFetch('/admin-api/leads/update', {
      method: 'POST',
      body: { id: lead.id, [field]: value },
      token,
    });
    if (result.ok) {
      setLead(result.data.lead);
    }
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!token || !lead || !newNote.trim()) return;
    const result = await adminFetch('/admin-api/leads/notes/add', {
      method: 'POST',
      body: { lead_id: lead.id, note: newNote.trim(), author: 'Admin' },
      token,
    });
    if (result.ok) {
      setNotes([result.data.note, ...notes]);
      setNewNote('');
    }
  };

  const handleDelete = async () => {
    if (!token || !lead) return;
    const result = await adminFetch('/admin-api/leads/delete', { method: 'DELETE', body: { id: lead.id }, token });
    if (result.ok) {
      router.push('/admin/leads');
    }
  };

  if (loading) return <LoadingSpinner label="Loading lead…" />;
  if (error || !lead) return <ErrorState message={error || 'Lead not found'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/leads" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
          <p className="text-sm text-gray-500">{LEAD_TYPES[lead.lead_type as keyof typeof LEAD_TYPES] || lead.lead_type} · {formatDateTime(lead.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{lead.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                    <Phone className="w-3.5 h-3.5" /> {lead.phone}
                  </a>
                </dd>
              </div>
              {lead.whatsapp && (
                <div>
                  <dt className="text-gray-500">WhatsApp</dt>
                  <dd className="font-medium text-gray-900">{lead.whatsapp}</dd>
                </div>
              )}
              {lead.email && (
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium text-gray-900">
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Mail className="w-3.5 h-3.5" /> {lead.email}
                    </a>
                  </dd>
                </div>
              )}
              {lead.district_village && (
                <div>
                  <dt className="text-gray-500">District / Village</dt>
                  <dd className="font-medium text-gray-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {lead.district_village}
                  </dd>
                </div>
              )}
              {lead.tractor_hp && (
                <div>
                  <dt className="text-gray-500">Tractor HP</dt>
                  <dd className="font-medium text-gray-900">{lead.tractor_hp}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Enquiry details */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enquiry Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Lead Type</dt>
                <dd className="font-medium text-gray-900">{LEAD_TYPES[lead.lead_type as keyof typeof LEAD_TYPES] || lead.lead_type}</dd>
              </div>
              {lead.enquiry_type && (
                <div>
                  <dt className="text-gray-500">Enquiry Type</dt>
                  <dd className="font-medium text-gray-900">{lead.enquiry_type}</dd>
                </div>
              )}
              {lead.service_type && (
                <div>
                  <dt className="text-gray-500">Service Type</dt>
                  <dd className="font-medium text-gray-900">{lead.service_type}</dd>
                </div>
              )}
              {lead.product_name && (
                <div>
                  <dt className="text-gray-500">Product</dt>
                  <dd className="font-medium text-gray-900">{lead.product_name}</dd>
                </div>
              )}
              {lead.partner_name && (
                <div>
                  <dt className="text-gray-500">OEM Partner</dt>
                  <dd className="font-medium text-gray-900">{lead.partner_name}</dd>
                </div>
              )}
              {lead.preferred_callback_time && (
                <div>
                  <dt className="text-gray-500">Preferred Callback Time</dt>
                  <dd className="font-medium text-gray-900">{lead.preferred_callback_time}</dd>
                </div>
              )}
              {lead.message && (
                <div>
                  <dt className="text-gray-500">Message</dt>
                  <dd className="text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded mt-1">{lead.message}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Source Page</dt>
                <dd className="font-mono text-xs text-gray-600">{lead.source_page}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Language</dt>
                <dd className="font-medium text-gray-900">{lead.language}</dd>
              </div>
            </dl>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Internal Notes
            </h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                placeholder="Add a note…"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none resize-y"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="mt-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Add Note
              </button>
            </div>
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-gray-400">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded text-sm">
                    <p className="text-gray-900">{note.note}</p>
                    <p className="text-xs text-gray-400 mt-1">{note.author} · {formatDateTime(note.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Management</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={lead.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
                >
                  {Object.entries(LEAD_STATUSES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={lead.priority}
                  onChange={(e) => handleUpdate('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
                >
                  {Object.entries(LEAD_PRIORITIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <input
                  type="text"
                  value={lead.assigned_to || ''}
                  onChange={(e) => handleUpdate('assigned_to', e.target.value)}
                  placeholder="Unassigned"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              {saving && <p className="text-xs text-gray-400">Saving…</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Meta</h2>
            <dl className="space-y-2 text-xs">
              <div><dt className="text-gray-500 inline">Created: </dt><dd className="text-gray-900 inline">{formatDateTime(lead.created_at)}</dd></div>
              <div><dt className="text-gray-500 inline">Updated: </dt><dd className="text-gray-900 inline">{formatDateTime(lead.updated_at)}</dd></div>
              <div><dt className="text-gray-500 inline">ID: </dt><dd className="text-gray-900 inline font-mono">{lead.id}</dd></div>
            </dl>
          </div>

          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full px-4 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Lead
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this lead?</h3>
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
