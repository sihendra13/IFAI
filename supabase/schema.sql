-- IFAI database schema
-- Run once against a fresh Supabase project (SQL Editor or psql).

-- ============================================================
-- 1. PROFILES (real logged-in accounts: extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. CREATORS (public-facing attribution — admin-managed,
-- does NOT require the creator to have a login account.
-- linked_profile_id is filled in later if/when that creator
-- actually signs up and claims their entry.)
-- ============================================================
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  avatar_url text,
  bio text,
  social_instagram text,
  social_facebook text,
  social_youtube text,
  social_tiktok text,
  social_behance text,
  social_linkedin text,
  linked_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_id text,
  display_order int not null default 0
);

insert into public.categories (slug, name_en, name_id, display_order) values
  ('film', 'AI Film Showcase', 'Etalase Film', 1),
  ('commercial', 'Video Commercial Showcase', 'Etalase Iklan Video', 2),
  ('animation', 'Animation Showcase', 'Etalase Animasi', 3),
  ('music', 'Music & Sound Showcase', 'Etalase Musik & Suara', 4),
  ('visual-art', 'Visual Art Showcase', 'Etalase Seni Visual', 5);

-- ============================================================
-- 4. WORKS (both pending submissions and published works)
-- ============================================================
create table public.works (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete restrict,
  category_id uuid not null references public.categories(id),
  title_en text,
  title_id text,
  description_en text,
  description_id text,
  youtube_url text not null,
  tags text[] not null default '{}',
  duration text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  constraint works_title_required check (title_en is not null or title_id is not null)
);

create index works_status_idx on public.works (status);
create index works_category_idx on public.works (category_id);
create index works_creator_idx on public.works (creator_id);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.categories enable row level security;
alter table public.works enable row level security;

-- Profiles: public read, owner-only write
create policy "profiles_select_public" on public.profiles
  for select using (true);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Creators: public read; admin manages all; a claimed creator can edit their own entry
create policy "creators_select_public" on public.creators
  for select using (true);
create policy "creators_write_admin" on public.creators
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "creators_update_own_linked" on public.creators
  for update using (linked_profile_id = auth.uid());

-- Categories: public read, admin-only write
create policy "categories_select_public" on public.categories
  for select using (true);
create policy "categories_admin_write" on public.categories
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Works: public sees approved only; owners (via linked creator) see their own; admins see everything
create policy "works_select_approved" on public.works
  for select using (status = 'approved');
create policy "works_select_own" on public.works
  for select using (
    exists (select 1 from public.creators c where c.id = works.creator_id and c.linked_profile_id = auth.uid())
  );
create policy "works_select_admin" on public.works
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "works_insert_own" on public.works
  for insert with check (
    exists (select 1 from public.creators c where c.id = works.creator_id and c.linked_profile_id = auth.uid())
  );
create policy "works_insert_admin" on public.works
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "works_update_own_pending" on public.works
  for update using (
    status = 'pending'
    and exists (select 1 from public.creators c where c.id = works.creator_id and c.linked_profile_id = auth.uid())
  );
create policy "works_update_admin" on public.works
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "works_delete_admin" on public.works
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 6. TABLE-LEVEL GRANTS
-- RLS policies only filter rows; Postgres still requires an explicit
-- GRANT before anon/authenticated can attempt the operation at all.
-- ============================================================
grant usage on schema public to anon, authenticated;

grant select on public.categories to anon, authenticated;

grant select, insert, update on public.profiles to anon, authenticated;

grant select, insert, update, delete on public.creators to anon, authenticated;

grant select, insert, update, delete on public.works to anon, authenticated;
