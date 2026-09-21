-- Creator Hub spotlight — run once in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- One creator is shown on the homepage "Creator Hub" section at a time
-- (is_featured = true). Everything is entered from the admin "Creator Hub" tab.
-- Images reuse the existing public "signal-images" storage bucket (under the
-- "creator/" prefix), so there are no new storage policies to set up.

create table public.creator_spotlights (
  id uuid primary key default gen_random_uuid(),

  -- Only featured + approved rows are readable by the public homepage.
  -- "status" is here so user submissions + admin approval can reuse this
  -- table later; admin-created rows are approved right away.
  is_featured boolean not null default false,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),

  -- Creator
  name text not null,
  role text,                 -- e.g. "AI Filmmaker / Visual Storyteller"
  location text,
  photo_url text,
  quote_id text,
  quote_en text,
  bio_id text,
  bio_en text,
  profile_url text,          -- optional "More About ..." link

  -- Creative fields + tools (plain lists)
  fields text[] not null default '{}',
  tools text[] not null default '{}',

  -- Featured work
  work_title text,
  work_image_url text,
  work_duration text,        -- e.g. "08:24"
  work_meta_id text,         -- e.g. "FILM PENDEK • 2024 • 8 MENIT"
  work_meta_en text,
  work_synopsis_id text,
  work_synopsis_en text,
  work_pipeline text,
  work_curation text,
  work_watch_url text,
  work_detail_url text,
  works_url text,            -- optional "View All Works" link

  created_at timestamptz not null default now()
);

-- Never more than one featured creator, enforced by the database.
create unique index creator_spotlights_one_featured
  on public.creator_spotlights ((true))
  where is_featured;

alter table public.creator_spotlights enable row level security;

-- Public (logged-out visitors included) can read only the featured, approved creator.
create policy "Public can read featured creator spotlight"
  on public.creator_spotlights for select
  using (is_featured and status = 'approved');

-- Admins (profiles.role = 'admin') manage everything — same check the
-- existing works/creators policies use in supabase/schema.sql.
create policy "Admins can manage creator spotlights"
  on public.creator_spotlights for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

grant select on public.creator_spotlights to anon, authenticated;
grant insert, update, delete on public.creator_spotlights to authenticated;
