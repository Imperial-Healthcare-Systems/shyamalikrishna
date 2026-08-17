import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import { JOB_SELECT, normalizeJob, normalizeJobs } from '@/lib/careers';
import type {
  Category, Partner, Product, Service, Resource, Faq, Job, JobCategory, JobLocation, SiteSettings,
} from '@/lib/types';

/**
 * Server-side counterparts to the hooks in `lib/hooks.ts`.
 *
 * Route segments call these during render so the HTML ships with real content
 * instead of a loading spinner; the same data is then handed to the client
 * component as `initial*` props so it never refetches on mount.
 *
 * `cache()` dedupes within a single request — a page and its generateMetadata
 * asking for the same record hit the database once.
 */

const PRODUCT_SELECT = '*, category:categories(*), partner:partners(*)';

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  return data || [];
});

export const getCategory = cache(async (slug: string): Promise<Category | null> => {
  const { data } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
  return data;
});

export const getPartners = cache(async (): Promise<Partner[]> => {
  const { data } = await supabase
    .from('partners')
    .select('*')
    .order('display_order', { ascending: true });
  return data || [];
});

export const getPartner = cache(async (slug: string): Promise<Partner | null> => {
  const { data } = await supabase.from('partners').select('*').eq('slug', slug).maybeSingle();
  return data;
});

export const getProducts = cache(async (): Promise<Product[]> => {
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_published', true)
    .order('display_order', { ascending: true });
  return data || [];
});

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  return data;
});

export const getCategoryProducts = cache(async (categoryId: string): Promise<Product[]> => {
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('category_id', categoryId)
    .eq('is_published', true)
    .order('display_order', { ascending: true });
  return data || [];
});

export const getPartnerProducts = cache(async (partnerId: string): Promise<Product[]> => {
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('partner_id', partnerId)
    .eq('is_published', true)
    .order('display_order', { ascending: true });
  return data || [];
});

export const getServices = cache(async (): Promise<Service[]> => {
  const { data } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });
  return data || [];
});

export const getService = cache(async (slug: string): Promise<Service | null> => {
  const { data } = await supabase.from('services').select('*').eq('slug', slug).maybeSingle();
  return data;
});

export const getResources = cache(async (type?: string): Promise<Resource[]> => {
  let query = supabase
    .from('resources')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true });
  if (type) query = query.eq('type', type);
  const { data } = await query;
  return data || [];
});

export const getFaqs = cache(async (): Promise<Faq[]> => {
  const { data } = await supabase
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true });
  return data || [];
});

export const getJobs = cache(async (): Promise<Job[]> => {
  const { data } = await supabase
    .from('jobs')
    .select(JOB_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return normalizeJobs(data as Array<Record<string, unknown>> | null);
});

/**
 * Published *and* closed, deliberately.
 *
 * A closed vacancy's URL is already out there — in an email, a WhatsApp
 * forward, someone's bookmarks. Answering 404 there is worse than answering
 * "this position is no longer accepting applications", so the page renders and
 * the apply form is what disappears. Drafts are excluded: those have never
 * been public and must not become public by URL guess.
 */
export const getJob = cache(async (slug: string): Promise<Job | null> => {
  const { data } = await supabase
    .from('jobs')
    .select(JOB_SELECT)
    .eq('slug', slug)
    .in('status', ['published', 'closed'])
    .maybeSingle();
  return normalizeJob(data as Record<string, unknown> | null);
});

export const getJobCategories = cache(async (): Promise<JobCategory[]> => {
  const { data } = await supabase
    .from('job_categories')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true });
  return data || [];
});

export const getJobLocations = cache(async (): Promise<JobLocation[]> => {
  const { data } = await supabase
    .from('job_locations')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true });
  return data || [];
});

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const { data } = await supabase.from('site_settings').select('key, value');
  if (!data) return {};
  const settings: SiteSettings = {};
  for (const row of data as { key: string; value: string }[]) settings[row.key] = row.value;
  return settings;
});
