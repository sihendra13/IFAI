-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Tracks who has joined the community (signed in via Google or email
-- magic link) with their email, so the admin can see a count and list
-- of members. This is a NEW, admin-only-readable table -- separate
-- from public.profiles, which is intentionally public-readable
-- (display name only) and must never have an email column added to it.

create table public.community_members (
  id uuid primary key references public.profiles(id) on delete cascade,
  email text not null,
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

-- No insert/update/delete policy for anon/authenticated: only the
-- SECURITY DEFINER trigger below is allowed to write to this table.

-- Extend the existing "new user" trigger to also record the email here.
-- Runs after profiles.id already exists (inserted just above it, same
-- transaction), so the community_members -> profiles foreign key holds.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.community_members (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Backfill everyone who already joined before this table existed.
insert into public.community_members (id, email, display_name, created_at)
select p.id, u.email, p.display_name, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
on conflict (id) do nothing;
