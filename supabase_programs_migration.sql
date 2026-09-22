-- Programs (Workshop / Kelas Online / Roadshow / etc.) — run once in Supabase
-- Dashboard -> SQL Editor -> New query -> Run.
--
-- Two tables:
--  - public.programs: the program listing (admin-managed), same trust level as
--    "signals" — anyone can read, only admins can write.
--  - public.program_registrations: one row per "Join/Daftar" submission. Anyone
--    can INSERT their own registration (no login required), but nobody but an
--    admin can read the list back — a visitor cannot see who else registered.

create table public.programs (
  id uuid primary key default gen_random_uuid(),

  -- "Workshop", "Kelas Online", "Roadshow", or any other admin-typed label —
  -- same free-text bilingual pattern as signals.label_*.
  label_id text,
  label_en text,
  title_id text,
  title_en text,
  description_id text,
  description_en text,
  image_url text,

  event_date date,
  event_time text,       -- free text, e.g. "19:00 WIB" — start time isn't always a clean single value
  location_text text,    -- venue address, or "Online" / "Hybrid"
  online_url text,       -- Zoom/Meet link etc., optional
  quota text,            -- free text shown as-is (e.g. "30 peserta"), not enforced

  -- Manual override to close registration without deleting/hiding the program
  -- (the Join button then shows a disabled "Registration Closed" state).
  registration_open boolean not null default true,

  created_at timestamptz not null default now()
);

alter table public.programs enable row level security;

create policy "Public can read programs"
  on public.programs for select
  using (true);

create policy "Admins can manage programs"
  on public.programs for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

grant select on public.programs to anon, authenticated;
grant insert, update, delete on public.programs to authenticated;


create table public.program_registrations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.program_registrations enable row level security;

-- Anyone (including logged-out visitors) can submit a registration, but only
-- an insert — they get no way to read it back, so one visitor can't see
-- another's name/email/phone.
create policy "Public can register for a program"
  on public.program_registrations for insert
  with check (true);

create policy "Admins can read and manage registrations"
  on public.program_registrations for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

grant insert on public.program_registrations to anon, authenticated;
grant select, update, delete on public.program_registrations to authenticated;
