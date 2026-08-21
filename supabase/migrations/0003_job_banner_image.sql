-- ============================================================================
-- Job banner image
--
-- Adds the column the admin job editor uploads into, and a PUBLIC bucket to
-- hold the files. Run this in the Supabase SQL Editor after 0000.
--
-- Idempotent and non-destructive: safe to run twice.
-- ============================================================================

begin;

alter table public.jobs add column if not exists image_url text;

-- Public, unlike the `applications` bucket that holds CVs.
--
-- A banner is meant to be fetched by every visitor who opens the apply page,
-- so serving it through a signed URL minted per request would add a round trip
-- and defeat CDN caching for no benefit — there is nothing private in it. The
-- CV bucket stays private precisely because the opposite is true there.
--
-- Public buckets are readable over /storage/v1/object/public/<bucket>/<path>
-- without any policy on storage.objects. Writes still go through the server's
-- service-role key, which bypasses RLS, so no write policy is needed either.
insert into storage.buckets (id, name, public)
values ('job-images', 'job-images', true)
on conflict (id) do update set public = true;

commit;

-- ============================================================================
-- Verify
-- ============================================================================
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'jobs' and column_name = 'image_url';
--
--   select id, public from storage.buckets where id = 'job-images';
