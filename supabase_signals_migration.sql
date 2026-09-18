-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  label_en text,
  label_id text,
  title_en text,
  title_id text,
  description_en text,
  description_id text,
  image_url text,
  event_date date,
  created_at timestamptz not null default now()
);

alter table public.signals enable row level security;

-- Anyone (including logged-out visitors) can read signals — they're
-- public homepage content, same trust level as works/categories.
create policy "Public can read signals"
  on public.signals for select
  using (true);

-- Only admins (profiles.role = 'admin') can create/edit/delete signals,
-- matching the same admin-gating pattern already used for works/creators.
create policy "Admins can manage signals"
  on public.signals for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Storage bucket for Signal cover images (run in the same SQL Editor —
-- no need to use the Storage UI at all).
insert into storage.buckets (id, name, public)
values ('signal-images', 'signal-images', true)
on conflict (id) do nothing;

create policy "Public can view signal images"
  on storage.objects for select
  using (bucket_id = 'signal-images');

create policy "Admins can upload signal images"
  on storage.objects for insert
  with check (
    bucket_id = 'signal-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can update signal images"
  on storage.objects for update
  using (
    bucket_id = 'signal-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can delete signal images"
  on storage.objects for delete
  using (
    bucket_id = 'signal-images'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
