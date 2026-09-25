-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Fixes community_members to also capture people who join via Google
-- Sign-In. Google Sign-In on this site intentionally does NOT use
-- Supabase Auth (see functions/api/auth-session.js) -- it only mints a
-- custom signed session token stored in the browser's localStorage, so
-- no row is ever created in auth.users for a Google-only join, and the
-- original handle_new_user() trigger (which only fires on auth.users
-- inserts) never sees those people at all.
--
-- This replaces the old id -> profiles(id) foreign key with a plain
-- UUID + unique email, so BOTH the email-signup trigger below AND a new
-- server-side upsert from functions/api/auth-session.js (using the
-- Supabase service role key -- see that file) can write to the same
-- table, deduped by email instead of a Supabase Auth user id.
--
-- This drops and recreates community_members -- fine here since it only
-- ever held a handful of test rows; the backfill below repopulates the
-- email-based ones.

drop table if exists public.community_members;

create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.community_members enable row level security;

-- Reuses the is_admin() helper from supabase_signals_fix_rls_v2.sql;
-- recreated here too so this file can run on its own.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create policy "Admins can view community members"
  on public.community_members for select
  using (public.is_admin());

-- Admin-only select; the anon/authenticated roles get no insert/update/
-- delete grant at all here -- only the SECURITY DEFINER trigger (email
-- path) and the service-role key (Google path) can write to this table.
grant select on public.community_members to authenticated;

-- Extend the existing email-signup trigger to also record it here,
-- deduped by email now instead of by auth.users id.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.community_members (email, display_name)
  values (new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (email) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Backfill everyone who already joined via email before this table
-- existed, excluding admin accounts.
insert into public.community_members (email, display_name, created_at)
select u.email, p.display_name, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where p.role != 'admin'
on conflict (email) do nothing;
