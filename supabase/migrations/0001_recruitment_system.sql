-- ============================================================================
-- Shyamali Krishna Automobile — Recruitment Management System
--
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- It is idempotent: re-running it will not duplicate data or drop anything
-- you have entered through the admin portal.
--
-- What it does
--   1. Adds the dynamic lookup tables the admin portal manages:
--      job_categories, job_locations, employment_types.
--   2. Extends the existing `jobs` table with the recruitment fields
--      (category, vacancies, salary, skills, …) instead of creating a
--      parallel table, so existing admin screens keep working.
--   3. Adds job ↔ location many-to-many mapping.
--   4. Extends `job_applications` with the snapshot + notification-tracking
--      columns the career system needs.
--   5. Adds admin credential storage (hashed) and single-use reset tokens.
--   6. Closes the anon INSERT hole on job_applications — applications now go
--      through the server route, which validates the job before writing.
--   7. Seeds categories, the six salesman locations, employment types, and
--      the three initial vacancies.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Job categories  (dynamic — admin can add/rename/deactivate/delete)
-- ---------------------------------------------------------------------------
create table if not exists public.job_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  name_hi       text,
  slug          text not null,
  description   text,
  active        boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists job_categories_slug_key on public.job_categories (slug);
create unique index if not exists job_categories_name_key on public.job_categories (lower(name));

-- ---------------------------------------------------------------------------
-- 2. Job locations  (dynamic — not limited to the six seeded towns)
-- ---------------------------------------------------------------------------
create table if not exists public.job_locations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  name_hi       text,
  slug          text not null,
  active        boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists job_locations_slug_key on public.job_locations (slug);
create unique index if not exists job_locations_name_key on public.job_locations (lower(name));

-- ---------------------------------------------------------------------------
-- 3. Employment types  (dynamic — admin can add custom types)
-- ---------------------------------------------------------------------------
create table if not exists public.employment_types (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null,
  active        boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists employment_types_slug_key on public.employment_types (slug);
create unique index if not exists employment_types_name_key on public.employment_types (lower(name));

-- ---------------------------------------------------------------------------
-- 4. Extend `jobs`
--
--    `department` and `location` are kept and written as denormalised
--    snapshots of the category name / joined location names. Older screens
--    and any saved report that reads them keeps working, and a job that
--    outlives its category still shows what it was filed under.
-- ---------------------------------------------------------------------------
alter table public.jobs add column if not exists category_id        uuid references public.job_categories (id) on delete set null;
alter table public.jobs add column if not exists vacancies          integer not null default 1;
alter table public.jobs add column if not exists experience_level   text;
alter table public.jobs add column if not exists min_experience     text;
alter table public.jobs add column if not exists max_experience     text;
alter table public.jobs add column if not exists description        text;
alter table public.jobs add column if not exists description_hi     text;
alter table public.jobs add column if not exists skills             text;
alter table public.jobs add column if not exists salary_type        text;
alter table public.jobs add column if not exists salary_min         numeric;
alter table public.jobs add column if not exists salary_max         numeric;
alter table public.jobs add column if not exists salary_period      text;
alter table public.jobs add column if not exists salary_negotiable  boolean not null default false;
alter table public.jobs add column if not exists contact_info       text;
alter table public.jobs add column if not exists additional_notes   text;

create index if not exists jobs_category_id_idx on public.jobs (category_id);
create index if not exists jobs_status_idx      on public.jobs (status);
create unique index if not exists jobs_slug_key on public.jobs (slug);

-- Legacy rows used status 'archived'; the portal now speaks draft/published/closed.
update public.jobs set status = 'closed' where status = 'archived';

-- ---------------------------------------------------------------------------
-- 5. Job ↔ location mapping (a job may be open in several towns)
-- ---------------------------------------------------------------------------
create table if not exists public.job_location_map (
  job_id      uuid not null references public.jobs (id) on delete cascade,
  location_id uuid not null references public.job_locations (id) on delete cascade,
  primary key (job_id, location_id)
);

create index if not exists job_location_map_location_idx on public.job_location_map (location_id);

-- ---------------------------------------------------------------------------
-- 6. Extend `job_applications`
--
--    The snapshot columns freeze what the applicant actually applied to, so
--    the record still reads correctly after the job is renamed or its
--    category is deleted.
-- ---------------------------------------------------------------------------
alter table public.job_applications add column if not exists job_title_snapshot           text;
alter table public.job_applications add column if not exists category_snapshot            text;
alter table public.job_applications add column if not exists preferred_location           text;
alter table public.job_applications add column if not exists address                      text;
alter table public.job_applications add column if not exists notification_status          text not null default 'pending';
alter table public.job_applications add column if not exists notification_attempts        integer not null default 0;
alter table public.job_applications add column if not exists notification_last_attempt_at timestamptz;
alter table public.job_applications add column if not exists notification_error           text;

create index if not exists job_applications_job_id_idx  on public.job_applications (job_id);
create index if not exists job_applications_created_idx on public.job_applications (created_at desc);
create index if not exists job_applications_status_idx  on public.job_applications (status);
-- Backs the duplicate-submission check (same person, same job, same minute).
create index if not exists job_applications_dupe_idx    on public.job_applications (lower(email), job_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 7. Admin credentials + password reset tokens
--
--    Single-row table. Until the admin changes the password from the portal
--    this stays empty and the server falls back to the ADMIN_PASSWORD env
--    var; the first successful login writes the hash. Nothing here is ever
--    reversible — only a scrypt hash is stored.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_credentials (
  id                   smallint primary key default 1 check (id = 1),
  password_hash        text not null,
  must_change_password boolean not null default false,
  password_changed_at  timestamptz not null default now(),
  last_login_at        timestamptz,
  updated_at           timestamptz not null default now()
);

create table if not exists public.admin_password_resets (
  id         uuid primary key default gen_random_uuid(),
  token_hash text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  ip_address text,
  created_at timestamptz not null default now()
);

create unique index if not exists admin_password_resets_token_key on public.admin_password_resets (token_hash);
create index if not exists admin_password_resets_expiry_idx on public.admin_password_resets (expires_at);

-- ---------------------------------------------------------------------------
-- 8. Row Level Security
--
--    Public (anon) may read only ACTIVE lookup rows. Everything the admin
--    portal writes goes through the service-role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.job_categories       enable row level security;
alter table public.job_locations        enable row level security;
alter table public.employment_types     enable row level security;
alter table public.job_location_map     enable row level security;
alter table public.admin_credentials    enable row level security;
alter table public.admin_password_resets enable row level security;

drop policy if exists "job_categories public read"   on public.job_categories;
drop policy if exists "job_locations public read"    on public.job_locations;
drop policy if exists "employment_types public read" on public.employment_types;
drop policy if exists "job_location_map public read" on public.job_location_map;

create policy "job_categories public read"   on public.job_categories   for select to anon, authenticated using (active);
create policy "job_locations public read"    on public.job_locations    for select to anon, authenticated using (active);
create policy "employment_types public read" on public.employment_types for select to anon, authenticated using (active);
create policy "job_location_map public read" on public.job_location_map for select to anon, authenticated using (true);

-- admin_credentials / admin_password_resets deliberately have NO policies:
-- with RLS on and no policy, anon and authenticated see nothing at all.

-- ---------------------------------------------------------------------------
-- 9. Lock down job_applications
--
--    The old public form inserted straight into this table with the anon key,
--    which meant anyone could write a row for any job_id — including a draft
--    or closed job. Applications now go through POST /api/careers/apply,
--    which validates the job server-side and writes with the service role.
--    Remove every anon-facing policy and turn RLS on so nothing else can.
-- ---------------------------------------------------------------------------
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'job_applications'
  loop
    execute format('drop policy %I on public.job_applications', pol.policyname);
  end loop;
end $$;

alter table public.job_applications enable row level security;
revoke all on public.job_applications from anon;

-- ---------------------------------------------------------------------------
-- 10. Private storage bucket for CVs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do update set public = false;

-- Uploads are performed by the server with the service-role key, so the
-- browser needs no write access to this bucket at all.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname ilike '%application%'
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 11. Seed — job categories
--
--     Derived from what this business actually does: a multi-OEM agricultural
--     machinery dealership in Nawada that sells, services, stocks parts for,
--     and arranges finance/subsidy on farm implements.
-- ---------------------------------------------------------------------------
insert into public.job_categories (name, name_hi, slug, description, display_order) values
  ('Sales',                  'बिक्री',              'sales',                  'Counter and field sales of tractors and farm implements.',              1),
  ('Field Operations',       'फील्ड संचालन',        'field-operations',       'On-farm demonstrations, delivery, and machine commissioning.',          2),
  ('Service & Technical',    'सेवा एवं तकनीकी',     'service-technical',      'After-sales service, repair, and technician roles.',                    3),
  ('Spare Parts & Stores',   'स्पेयर पार्ट्स एवं स्टोर', 'spare-parts-stores',  'Parts counter, inventory, and warehouse handling.',                     4),
  ('Administration',         'प्रशासन',             'administration',         'Office administration, records, and documentation.',                    5),
  ('Computer / IT',          'कंप्यूटर / आईटी',      'computer-it',            'Data entry, billing software, and computer operations.',                6),
  ('Accounts & Finance',     'लेखा एवं वित्त',      'accounts-finance',       'Billing, accounts, EMI and subsidy paperwork.',                         7),
  ('Management',             'प्रबंधन',             'management',             'Branch, territory, and team leadership roles.',                         8)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 12. Seed — locations (the six salesman territories; admin can add more)
-- ---------------------------------------------------------------------------
insert into public.job_locations (name, slug, display_order) values
  ('Kashichak',   'kashichak',   1),
  ('Pakribarma',  'pakribarma',  2),
  ('Nawada',      'nawada',      3),
  ('Meskaur',     'meskaur',     4),
  ('Roh',         'roh',         5),
  ('Kawakol',     'kawakol',     6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 13. Seed — employment types
-- ---------------------------------------------------------------------------
insert into public.employment_types (name, slug, display_order) values
  ('Full Time',  'full-time',  1),
  ('Part Time',  'part-time',  2),
  ('Contract',   'contract',   3),
  ('Internship', 'internship', 4),
  ('Temporary',  'temporary',  5),
  ('Other',      'other',      6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 14. Seed — the three initial vacancies
--
--     Only the facts that were supplied are set. Salary, qualifications,
--     experience and responsibilities are deliberately left blank for the
--     admin to fill in from the portal.
-- ---------------------------------------------------------------------------
insert into public.jobs (title, slug, category_id, department, vacancies, employment_type, status, published_at)
select 'Computer Operator', 'computer-operator', c.id, c.name, 3, 'Full Time', 'published', now()
from public.job_categories c where c.slug = 'computer-it'
on conflict (slug) do nothing;

insert into public.jobs (title, slug, category_id, department, vacancies, employment_type, status, published_at)
select 'Salesman', 'salesman', c.id, c.name, 6, 'Full Time', 'published', now()
from public.job_categories c where c.slug = 'sales'
on conflict (slug) do nothing;

insert into public.jobs (title, slug, category_id, department, vacancies, employment_type, status, published_at)
select 'Sales Manager', 'sales-manager', c.id, c.name, 2, 'Full Time', 'published', now()
from public.job_categories c where c.slug = 'management'
on conflict (slug) do nothing;

-- Salesman is open in all six territories.
insert into public.job_location_map (job_id, location_id)
select j.id, l.id
from public.jobs j
cross join public.job_locations l
where j.slug = 'salesman'
  and l.slug in ('kashichak', 'pakribarma', 'nawada', 'meskaur', 'roh', 'kawakol')
on conflict do nothing;

-- The other two are head-office roles in Nawada.
insert into public.job_location_map (job_id, location_id)
select j.id, l.id
from public.jobs j
cross join public.job_locations l
where j.slug in ('computer-operator', 'sales-manager')
  and l.slug = 'nawada'
on conflict do nothing;

-- Refresh the denormalised location snapshot on the seeded rows.
update public.jobs j
set location = sub.names
from (
  select m.job_id, string_agg(l.name, ', ' order by l.display_order) as names
  from public.job_location_map m
  join public.job_locations l on l.id = m.location_id
  group by m.job_id
) sub
where sub.job_id = j.id;

-- ---------------------------------------------------------------------------
-- 15. Seed — careers notification address
--
--     Seeded from the address already on file in site_settings so the admin
--     does not have to retype it. Editable at /admin/settings.
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value)
select 'careers_email', coalesce(
  (select value from public.site_settings where key = 'email'),
  'info@shyamalikrishna.com'
)
on conflict (key) do nothing;

insert into public.site_settings (key, value)
values ('careers_recovery_email', 'info@shyamalikrishna.com')
on conflict (key) do nothing;

commit;

-- ============================================================================
-- Verification
-- ============================================================================
--   select name, slug, active from public.job_categories order by display_order;
--   select name, slug, active from public.job_locations  order by display_order;
--   select title, slug, vacancies, status, location from public.jobs;
