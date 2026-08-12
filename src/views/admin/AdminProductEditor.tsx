'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';
import { slugify } from '@/lib/types';

interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  category_id: string;
  partner_id: string;
  positioning: string;
  overview: string;
  features: string;
  benefits: string;
  applications: string;
  crops: string;
  soil_conditions: string;
  operator_scale: string;
  tractor_hp: string;
  working_width: string;
  weight: string;
  blade_tine_config: string;
  gearbox_drive: string;
  rpm: string;
  warranty: string;
  financing: string;
  subsidy: string;
  primary_image_url: string;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
  display_order: number;
}

const emptyForm: ProductFormData = {
  name: '', slug: '', category_id: '', partner_id: '', positioning: '', overview: '',
  features: '', benefits: '', applications: '', crops: '', soil_conditions: '',
  operator_scale: '', tractor_hp: '', working_width: '', weight: '', blade_tine_config: '',
  gearbox_drive: '', rpm: '', warranty: '', financing: '', subsidy: '',
  primary_image_url: '', seo_title: '', seo_description: '', is_published: true, display_order: 0,
};

export function AdminProductEditor() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: parts }] = await Promise.all([
        supabase.from('categories').select('id, name').order('display_order'),
        supabase.from('partners').select('id, name').order('display_order'),
      ]);
      setCategories(cats || []);
      setPartners(parts || []);

      if (id && token) {
        const result = await adminFetch('/admin-api/products/get', { token, searchParams: { id } });
        if (result.ok) {
          const p = result.data.product;
          setForm({
            id: p.id, name: p.name, slug: p.slug,
            category_id: p.category_id || '', partner_id: p.partner_id || '',
            positioning: p.positioning || '', overview: p.overview || '',
            features: p.features || '', benefits: p.benefits || '',
            applications: p.applications || '', crops: p.crops || '',
            soil_conditions: p.soil_conditions || '', operator_scale: p.operator_scale || '',
            tractor_hp: p.tractor_hp || '', working_width: p.working_width || '',
            weight: p.weight || '', blade_tine_config: p.blade_tine_config || '',
            gearbox_drive: p.gearbox_drive || '', rpm: p.rpm || '',
            warranty: p.warranty || '', financing: p.financing || '', subsidy: p.subsidy || '',
            primary_image_url: p.primary_image_url || '',
            seo_title: p.seo_title || '', seo_description: p.seo_description || '',
            is_published: p.is_published, display_order: p.display_order,
          });
        }
      }
      setLoading(false);
    })();
  }, [id, token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    if (!form.name || !form.slug) {
      setError('Name and slug are required');
      setSaving(false);
      return;
    }
    const result = await adminFetch('/admin-api/products/save', {
      method: 'POST',
      body: {
        ...form,
        category_id: form.category_id || null,
        partner_id: form.partner_id || null,
      },
      token,
    });
    if (result.ok) {
      router.push('/admin/products');
    } else {
      setError(result.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner label="Loading product…" />;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Product' : 'New Product'}</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{error}</div>}

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Product Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Slug *</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputClass}>
              <option value="">— Select —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>OEM Partner</label>
            <select value={form.partner_id} onChange={(e) => setForm({ ...form, partner_id: e.target.value })} className={inputClass}>
              <option value="">— Select —</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Display Order</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Positioning Statement</label>
          <textarea value={form.positioning} onChange={(e) => setForm({ ...form, positioning: e.target.value })} rows={2} className={`${inputClass} resize-y`} />
        </div>

        <div>
          <label className={labelClass}>Overview</label>
          <textarea value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} rows={4} className={`${inputClass} resize-y`} />
        </div>

        <div>
          <label className={labelClass}>Features (semicolon-separated)</label>
          <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={3} className={`${inputClass} resize-y`} placeholder="Feature 1; Feature 2; Feature 3" />
        </div>

        <div>
          <label className={labelClass}>Benefits (semicolon-separated)</label>
          <textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={3} className={`${inputClass} resize-y`} placeholder="Benefit 1; Benefit 2; Benefit 3" />
        </div>

        <div>
          <label className={labelClass}>Applications</label>
          <textarea value={form.applications} onChange={(e) => setForm({ ...form, applications: e.target.value })} rows={3} className={`${inputClass} resize-y`} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={labelClass}>Crops</label><input type="text" value={form.crops} onChange={(e) => setForm({ ...form, crops: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Tractor HP</label><input type="text" value={form.tractor_hp} onChange={(e) => setForm({ ...form, tractor_hp: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Working Width</label><input type="text" value={form.working_width} onChange={(e) => setForm({ ...form, working_width: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Weight</label><input type="text" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={labelClass}>Blade/Tine Config</label><input type="text" value={form.blade_tine_config} onChange={(e) => setForm({ ...form, blade_tine_config: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Gearbox/Drive</label><input type="text" value={form.gearbox_drive} onChange={(e) => setForm({ ...form, gearbox_drive: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>RPM</label><input type="text" value={form.rpm} onChange={(e) => setForm({ ...form, rpm: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Warranty</label><input type="text" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Financing</label><textarea value={form.financing} onChange={(e) => setForm({ ...form, financing: e.target.value })} rows={2} className={`${inputClass} resize-y`} /></div>
          <div><label className={labelClass}>Subsidy</label><textarea value={form.subsidy} onChange={(e) => setForm({ ...form, subsidy: e.target.value })} rows={2} className={`${inputClass} resize-y`} /></div>
        </div>

        <div>
          <label className={labelClass}>Primary Image URL</label>
          <input type="url" value={form.primary_image_url} onChange={(e) => setForm({ ...form, primary_image_url: e.target.value })} className={inputClass} placeholder="https://…" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>SEO Title</label><input type="text" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>SEO Description</label><input type="text" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} className={inputClass} /></div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4" />
            Published
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
