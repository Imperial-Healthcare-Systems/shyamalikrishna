'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { slugify } from '@/lib/types';
import type { Partner } from '@/lib/types';

export function AdminPartners() {
  const { token } = useAdminAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Partner>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const result = await adminFetch('/admin-api/partners', { token });
    if (result.ok) setPartners(result.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const startEdit = (p: Partner) => { setEditing(p); setForm(p); setCreating(false); };
  const startCreate = () => { setCreating(true); setEditing(null); setForm({ name: '', slug: '', tagline: '', positioning: '', overview: '', origin_country: '', display_order: 0 }); };

  const handleSave = async () => {
    if (!token) return;
    const data = { ...form, slug: form.slug || slugify(form.name || '') };
    const result = await adminFetch('/admin-api/partners/save', { method: 'POST', body: { id: editing?.id, ...data }, token });
    if (result.ok) { setEditing(null); setCreating(false); setForm({}); fetchPartners(); }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    const result = await adminFetch('/admin-api/partners/delete', { method: 'DELETE', body: { id }, token });
    if (result.ok) { setConfirmDelete(null); fetchPartners(); }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (loading) return <LoadingSpinner label="Loading partners…" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">OEM Partners</h1><p className="text-sm text-gray-500 mt-1">{partners.length} partners</p></div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700"><Plus className="w-4 h-4" /> New Partner</button>
      </div>

      {(creating || editing) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Partner' : 'New Partner'}</h2>
            <button onClick={() => { setCreating(false); setEditing(null); }} className="p-2 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Name *</label><input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Slug *</label><input type="text" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Tagline</label><input type="text" value={form.tagline || ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Origin Country</label><input type="text" value={form.origin_country || ''} onChange={(e) => setForm({ ...form, origin_country: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>Positioning</label><textarea value={form.positioning || ''} onChange={(e) => setForm({ ...form, positioning: e.target.value })} rows={2} className={`${inputClass} resize-y`} /></div>
          <div><label className={labelClass}>Overview</label><textarea value={form.overview || ''} onChange={(e) => setForm({ ...form, overview: e.target.value })} rows={4} className={`${inputClass} resize-y`} /></div>
          <div><label className={labelClass}>Partnership Context</label><textarea value={form.partnership_context || ''} onChange={(e) => setForm({ ...form, partnership_context: e.target.value })} rows={3} className={`${inputClass} resize-y`} /></div>
          <div><label className={labelClass}>Why Partnership Matters</label><textarea value={form.why_partnership_matters || ''} onChange={(e) => setForm({ ...form, why_partnership_matters: e.target.value })} rows={2} className={`${inputClass} resize-y`} /></div>
          <div><label className={labelClass}>Logo URL</label><input type="url" value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Display Order</label><input type="number" value={form.display_order || 0} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
          <button onClick={handleSave} className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
        </div>
      )}

      {partners.length === 0 && !creating ? (
        <div className="bg-white rounded-lg border border-gray-200"><EmptyState title="No partners yet" message="Add your first OEM partner." /></div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><th className="text-left px-4 py-3 font-medium text-gray-600">Name</th><th className="text-left px-4 py-3 font-medium text-gray-600">Country</th><th className="text-left px-4 py-3 font-medium text-gray-600">Order</th><th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.origin_country || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.display_order}</td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-2"><button onClick={() => startEdit(p)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Edit className="w-4 h-4" /></button><button onClick={() => setConfirmDelete(p.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this partner?</h3>
            <p className="text-sm text-gray-600 mb-4">Products linked to this partner will lose their partner link.</p>
            <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">Cancel</button><button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
}


