'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { adminFetch } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/States';

const SETTING_FIELDS = [
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
  { key: 'legal_name', label: 'Legal Name', type: 'text' },
  { key: 'office_line1', label: 'Office Line 1', type: 'text' },
  { key: 'office_line2', label: 'Office Line 2', type: 'text' },
  { key: 'office_line3', label: 'Office Line 3', type: 'text' },
  { key: 'office_line4', label: 'Office Line 4', type: 'text' },
  { key: 'gst', label: 'GST', type: 'text' },
  { key: 'hours_weekday', label: 'Weekday Hours', type: 'text' },
  { key: 'hours_sunday', label: 'Sunday Hours', type: 'text' },
  { key: 'maps_query', label: 'Maps Query', type: 'text' },
];

export function AdminSettings() {
  const { token } = useAdminAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const result = await adminFetch('/admin-api/settings', { token });
    if (result.ok) {
      setSettings(result.data.settings || {});
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    const result = await adminFetch('/admin-api/settings/save', {
      method: 'POST',
      body: { settings },
      token,
    });
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner label="Loading settings…" />;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gray-900 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Site-wide contact and business information</p>
      </div>

      {saved && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">Settings saved successfully</div>}

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SETTING_FIELDS.map((field) => (
            <div key={field.key}>
              <label className={labelClass}>{field.label}</label>
              <input
                type={field.type}
                value={settings[field.key] || ''}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                className={inputClass}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
