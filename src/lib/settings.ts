import { supabase } from '@/lib/supabase';

export interface SiteSettings {
  [key: string]: string;
}

let cachedSettings: SiteSettings | null = null;

export async function getSettings(): Promise<SiteSettings> {
  if (cachedSettings) return cachedSettings;
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error || !data) return {};
  cachedSettings = {};
  data.forEach((item: { key: string; value: string }) => {
    cachedSettings![item.key] = item.value;
  });
  return cachedSettings;
}

export function clearSettingsCache() {
  cachedSettings = null;
}
