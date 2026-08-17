'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { JOB_SELECT, normalizeJob, normalizeJobs } from '@/lib/careers';
import type {
  Category, Partner, Product, Service, Resource, Faq, Job, JobCategory, JobLocation, SiteSettings,
} from '@/lib/types';
import { getSettings } from '@/lib/settings';

// Generic hook for async data.
// When `initial` is supplied (server-rendered data passed down as a prop) the
// hook starts populated and skips the mount fetch — later dependency changes,
// such as a filter the user types, still refetch normally.
export function useAsync<T>(fetcher: () => Promise<T>, deps: any[] = [], initial?: T | null) {
  const seeded = initial !== undefined;
  const [data, setData] = useState<T | null>(seeded ? initial! : null);
  const [loading, setLoading] = useState(!seeded);
  const [error, setError] = useState<string | null>(null);
  const skipNextFetch = useRef(seeded);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    let mounted = true;
    setLoading(true);
    fetcher()
      .then((result) => {
        if (mounted) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load data');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

export function useCategories(initial?: Category[]) {
  return useAsync<Category[]>(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], initial);
}

export function usePartners(initial?: Partner[]) {
  return useAsync<Partner[]>(async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], initial);
}

export function useProducts(filters?: { categoryId?: string; partnerId?: string; search?: string }, initial?: Product[]) {
  return useAsync<Product[]>(async () => {
    let query = supabase
      .from('products')
      .select('*, category:categories(*), partner:partners(*)')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.partnerId) query = query.eq('partner_id', filters.partnerId);
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,positioning.ilike.%${filters.search}%,crops.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [filters?.categoryId, filters?.partnerId, filters?.search], initial);
}

export function useProduct(slug: string | undefined, initial?: Product | null) {
  return useAsync<Product | null>(async () => {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), partner:partners(*)')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, [slug], initial);
}

export function usePartner(slug: string | undefined, initial?: Partner | null) {
  return useAsync<Partner | null>(async () => {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, [slug], initial);
}

export function usePartnerProducts(partnerId: string | undefined, initial?: Product[]) {
  return useAsync<Product[]>(async () => {
    if (!partnerId) return [];
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), partner:partners(*)')
      .eq('partner_id', partnerId)
      .eq('is_published', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [partnerId], initial);
}

export function useCategoryProducts(categoryId: string | undefined, initial?: Product[]) {
  return useAsync<Product[]>(async () => {
    if (!categoryId) return [];
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), partner:partners(*)')
      .eq('category_id', categoryId)
      .eq('is_published', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [categoryId], initial);
}

export function useCategory(slug: string | undefined, initial?: Category | null) {
  return useAsync<Category | null>(async () => {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, [slug], initial);
}

export function useServices(initial?: Service[]) {
  return useAsync<Service[]>(async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], initial);
}

export function useService(slug: string | undefined, initial?: Service | null) {
  return useAsync<Service | null>(async () => {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, [slug], initial);
}

export function useResources(type?: string, initial?: Resource[]) {
  return useAsync<Resource[]>(async () => {
    let query = supabase
      .from('resources')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [type], initial);
}

export function useFaqs(initial?: Faq[]) {
  return useAsync<Faq[]>(async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], initial);
}

/**
 * Every published job, once.
 *
 * Filtering is done in the view rather than by refetching per keystroke: the
 * whole list is a handful of rows for a single dealership, so a round trip per
 * character would add latency and a loading flicker to buy nothing. It also
 * means "Clear Filters" is instant and the counts stay consistent.
 */
export function useJobs(initial?: Job[]) {
  return useAsync<Job[]>(async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(JOB_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return normalizeJobs(data as Array<Record<string, unknown>> | null);
  }, [], initial);
}

export function useJob(slug: string | undefined, initial?: Job | null) {
  return useAsync<Job | null>(async () => {
    if (!slug) return null;
    const { data, error } = await supabase
      .from('jobs')
      .select(JOB_SELECT)
      .eq('slug', slug)
      .in('status', ['published', 'closed'])
      .maybeSingle();
    if (error) throw error;
    return normalizeJob(data as Record<string, unknown> | null);
  }, [slug], initial);
}

export function useJobCategories(initial?: JobCategory[]) {
  return useAsync<JobCategory[]>(async () => {
    const { data, error } = await supabase
      .from('job_categories')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], initial);
}

export function useJobLocations(initial?: JobLocation[]) {
  return useAsync<JobLocation[]>(async () => {
    const { data, error } = await supabase
      .from('job_locations')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [], initial);
}

export function useSiteSettings(initial?: SiteSettings) {
  return useAsync<SiteSettings>(async () => {
    return await getSettings();
  }, [], initial);
}
