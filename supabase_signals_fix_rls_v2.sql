-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- supabase_signals_fix_rls.sql (already run against this project) fixed a
-- real "new row violates row-level security policy" error on Signal image
-- uploads, but did it by weakening the check from "must be admin" to "must
-- just be logged in" -- so any ordinary signed-up member (Join Community,
-- no approval step) could create/edit/delete Signals and upload/overwrite/
-- delete files in the signal-images bucket.
--
-- This restores admin-only access, using a SECURITY DEFINER helper
-- function instead of the original inline subquery. The original inline
-- subquery (exists (select 1 from public.profiles where ...)) is what
-- failed inside a storage.objects policy; a SECURITY DEFINER function
-- reliably works around that because it runs with the function owner's
-- privileges, independent of whatever RLS/grant context the calling
-- request has when the policy is evaluated.

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

-- Storage: signal-images bucket -- replace the "Authenticated can ..." policies
drop policy if exists "Authenticated can upload signal images" on storage.objects;
drop policy if exists "Authenticated can update signal images" on storage.objects;
drop policy if exists "Authenticated can delete signal images" on storage.objects;

create policy "Admins can upload signal images"
  on storage.objects for insert
  with check (bucket_id = 'signal-images' and public.is_admin());

create policy "Admins can update signal images"
  on storage.objects for update
  using (bucket_id = 'signal-images' and public.is_admin());

create policy "Admins can delete signal images"
  on storage.objects for delete
  using (bucket_id = 'signal-images' and public.is_admin());

-- signals table -- replace the "Authenticated can manage signals" policy
drop policy if exists "Authenticated can manage signals" on public.signals;

create policy "Admins can manage signals"
  on public.signals for all
  using (public.is_admin())
  with check (public.is_admin());

-- creator-avatars bucket: written from admin.html but never had a policy
-- committed to source control, so its current state is unknown/unverified.
-- Running this ensures it's admin-gated regardless of whatever it was set
-- to before (drop if exists makes this safe to re-run).
insert into storage.buckets (id, name, public)
values ('creator-avatars', 'creator-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public can view creator avatars" on storage.objects;
drop policy if exists "Admins can upload creator avatars" on storage.objects;
drop policy if exists "Admins can update creator avatars" on storage.objects;
drop policy if exists "Admins can delete creator avatars" on storage.objects;
drop policy if exists "Authenticated can upload creator avatars" on storage.objects;
drop policy if exists "Authenticated can update creator avatars" on storage.objects;
drop policy if exists "Authenticated can delete creator avatars" on storage.objects;

create policy "Public can view creator avatars"
  on storage.objects for select
  using (bucket_id = 'creator-avatars');

create policy "Admins can upload creator avatars"
  on storage.objects for insert
  with check (bucket_id = 'creator-avatars' and public.is_admin());

create policy "Admins can update creator avatars"
  on storage.objects for update
  using (bucket_id = 'creator-avatars' and public.is_admin());

create policy "Admins can delete creator avatars"
  on storage.objects for delete
  using (bucket_id = 'creator-avatars' and public.is_admin());
