'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner, EmptyState } from '@/components/ui/States';
import { slugify } from '@/lib/types';
import type { Service, Resource, Faq } from '@/lib/types';

interface AdminResourcesProps {
  tab?: 'services' | 'resources' | 'faqs';
}

export function AdminResources({ tab = 'resources' }: AdminResourcesProps) {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<(Service | Resource | Faq)[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(tab);

  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    let endpoint = '/admin-api/services';
    if (activeTab === 'resources') endpoint = '/admin-api/resources';
    if (activeTab === 'faqs') endpoint = '/admin-api/faqs';
    const result = await adminFetch(endpoint, { token });
    if (result.ok) setItems(result.data || []);
    setLoading(false);
  }, [token, activeTab]);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const getEndpoint = () => {
    if (activeTab === 'services') return '/admin-api/services';
    if (activeTab === 'resources') return '/admin-api/resources';
    return '/admin-api/faqs';
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    if (activeTab === 'faqs') {
      setForm({ question: '', answer: '', category: '', display_order: 0 });
    } else if (activeTab === 'services') {
      setForm({ name: '', slug: '', short_description: '', overview: '', what_we_cover: '', display_order: 0 });
    } else {
      setForm({ title: '', slug: '', type: 'guide', excerpt: '', content: '', is_published: true, display_order: 0 });
    }
  };

  const startEdit = (item: any) => {
    setEditing(item);
    setCreating(false);
    setForm(item);
  };

  const handleSave = async () => {
    if (!token) return;
    const endpoint = getEndpoint();
    const data = { ...form };
    if (data.slug !== undefined && !data.slug) data.slug = slugify(data.name || data.title || '');
    const result = await adminFetch(`${endpoint}/save`, { method: 'POST', body: { id: editing?.id, ...data }, token });
    if (result.ok) { setEditing(null); setCreating(false); setForm({}); fetchItems(); }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    const endpoint = getEndpoint();
    const result = await adminFetch(`${endpoint}/delete`, { method: 'DELETE', body: { id }, token });
    if (result.ok) { setConfirmDelete(null); fetchItems(); }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-sm text-gray-500 mt-1">Services, Resources, FAQs</p>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700">
          <Plus className="w-4 h-4" /> New {activeTab === 'faqs' ? 'FAQ' : activeTab === 'services' ? 'Service' : 'Resource'}
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        {['services', 'resources', 'faqs'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`px-4 py-2 text-sm rounded capitalize transition-colors ${
              activeTab === t ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {(creating || editing) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit' : 'New'} {activeTab === 'faqs' ? 'FAQ' : activeTab === 'services' ? 'Service' : 'Resource'}</h2>
            <button onClick={() => { setCreating(false); setEditing(null); }} className="p-2 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
          </div>

          {activeTab === 'faqs' ? (
            <>
              <div><label className={labelClass}>Question *</label><input type="text" value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Answer *</label><textarea value={form.answer || ''} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} className={`${inputClass} resize-y`} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Category</label><input type="text" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Display Order</label><input type="number" value={form.display_order || 0} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
              </div>
            </>
          ) : activeTab === 'services' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Name *</label><input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Slug *</label><input type="text" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Short Description</label><input type="text" value={form.short_description || ''} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Overview</label><textarea value={form.overview || ''} onChange={(e) => setForm({ ...form, overview: e.target.value })} rows={3} className={`${inputClass} resize-y`} /></div>
              <div><label className={labelClass}>What We Cover (semicolon-separated)</label><textarea value={form.what_we_cover || ''} onChange={(e) => setForm({ ...form, what_we_cover: e.target.value })} rows={3} className={`${inputClass} resize-y`} /></div>
              <div><label className={labelClass}>Display Order</label><input type="number" value={form.display_order || 0} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
            </>
          ) : (
            <>
              <div><label className={labelClass}>Title *</label><input type="text" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Slug *</label><input type="text" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Type</label><select value={form.type || 'guide'} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}><option value="guide">Guide</option><option value="subsidy">Subsidy</option></select></div>
              </div>
              <div><label className={labelClass}>Excerpt</label><input type="text" value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Content</label><textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} className={`${inputClass} resize-y`} /></div>
              <div className="flex items-center gap-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4" />Published</label></div>
            </>
          )}

          <button onClick={handleSave} className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200"><EmptyState title={`No ${activeTab} yet`} message={`Create your first ${activeTab === 'faqs' ? 'FAQ' : activeTab === 'services' ? 'service' : 'resource'}.`} /></div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">{activeTab === 'faqs' ? 'Question' : 'Name/Title'}</th>
                {activeTab === 'faqs' && <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>}
                {activeTab === 'resources' && <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">{item.name || item.title || item.question}</td>
                  {activeTab === 'faqs' && <td className="px-4 py-3 text-gray-600">{item.category || '—'}</td>}
                  {activeTab === 'resources' && <td className="px-4 py-3 text-gray-600">{item.type}</td>}
                  <td className="px-4 py-3 text-gray-600">{item.display_order}</td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-2"><button onClick={() => startEdit(item)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Edit className="w-4 h-4" /></button><button onClick={() => setConfirmDelete(item.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this item?</h3>
            <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
            <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">Cancel</button><button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
