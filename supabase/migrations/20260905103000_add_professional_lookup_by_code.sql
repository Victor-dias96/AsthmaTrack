-- Issue 103: minimal, safe professional-discovery mechanism so a patient can
-- identify one exact medical-team profile to authorize, without any user
-- directory, partial search, or email exposure.
--
-- public.profiles has no email column (email lives only in auth.users, which
-- must never be queried from the browser) and full_name is explicitly not
-- unique, so neither is a safe lookup key. This migration adds the smallest
-- safe alternative: an opaque, system-generated `professional_code` that a
-- medical-team profile can share with a patient out of band, plus an
-- exact-match SECURITY DEFINER lookup function that returns at most one
-- minimal professional summary (id + full_name only) for the exact,
-- currently-persisted medical role. It does not grant medical-team access to
-- any patient health data.

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------
-- Null for every patient profile. Only ever populated for role = 'medical'
-- by the trigger below, never accepted directly from client input.
alter table public.profiles
  add column professional_code text;

-- Reduced-confusion charset (no 0/O or 1/I/L ambiguity) enforced at the
-- database layer regardless of how the value was produced.
alter table public.profiles
  add constraint profiles_professional_code_format
  check (professional_code is null or professional_code ~ '^[A-Z2-9]{8}$');

-- One code can never be shared by two profiles.
create unique index idx_profiles_professional_code
  on public.profiles (professional_code)
  where professional_code is not null;

comment on column public.profiles.professional_code is
  'Opaque 8-character code a medical-team profile can share with a patient so the patient can look up and authorize that exact professional via public.find_medical_professional_by_code. Always null for patient profiles. System-generated only; never writable by the authenticated role (see public.protect_profile_fields). Never used as a login credential.';

-- ---------------------------------------------------------------------------
-- Code generator (private helper, not an RPC)
-- ---------------------------------------------------------------------------
create or replace function private.generate_professional_code()
returns text
language plpgsql
as $$
declare
  -- 23 letters + 8 digits, excluding 0/O and 1/I/L to reduce transcription
  -- errors when a professional reads the code aloud or a patient types it.
  v_chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text := '';
begin
  for i in 1..8 loop
    v_code := v_code || substr(v_chars, (floor(random() * length(v_chars)) + 1)::int, 1);
  end loop;

  return v_code;
end;
$$;

comment on function private.generate_professional_code() is
  'Generates one random 8-character candidate professional_code. Uniqueness is verified by the caller (public.assign_professional_code); this function never touches the database.';

revoke all on function private.generate_professional_code() from public;
revoke all on function private.generate_professional_code() from anon;
revoke all on function private.generate_professional_code() from authenticated;

-- ---------------------------------------------------------------------------
-- Code assignment trigger
-- ---------------------------------------------------------------------------
-- Assigns a unique professional_code exactly once, only for role = 'medical'
-- profiles, and only for trusted (non-authenticated) database operations --
-- i.e. the same trust boundary already used for role/id in
-- public.protect_profile_fields(). No medical-team signup flow exists yet in
-- this codebase, so today this only runs when a profile's role is set to
-- 'medical' directly (postgres/service_role); it keeps working unchanged once
-- a medical-team signup or admin flow is added later.
create or replace function public.assign_professional_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempts int := 0;
begin
  -- An authenticated client can never trigger code assignment, even by
  -- attempting to set role = 'medical' on its own row: this mirrors
  -- protect_profile_fields() leaving role/id untouched for that role.
  if current_user = 'authenticated' then
    return new;
  end if;

  if new.role = 'medical'::public.user_role and new.professional_code is null then
    loop
      v_code := private.generate_professional_code();
      v_attempts := v_attempts + 1;

      if not exists (
        select 1 from public.profiles where profiles.professional_code = v_code
      ) then
        new.professional_code := v_code;
        exit;
      end if;

      if v_attempts >= 20 then
        raise exception 'unable to generate a unique professional code';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

comment on function public.assign_professional_code() is
  'Assigns a unique professional_code to a medical-team profile that does not have one yet. Never runs for the authenticated role and never touches patient profiles.';

create trigger assign_professional_code_trigger
before insert or update on public.profiles
for each row
execute function public.assign_professional_code();

-- Backfill any medical-team profile that already existed before this
-- migration (e.g. seeded directly for development) so the feature works
-- immediately for already-persisted professionals.
do $$
declare
  r record;
  v_code text;
  v_attempts int;
begin
  for r in
    select id from public.profiles
    where role = 'medical'::public.user_role
      and professional_code is null
  loop
    v_attempts := 0;

    loop
      v_code := private.generate_professional_code();
      v_attempts := v_attempts + 1;

      exit when not exists (
        select 1 from public.profiles where profiles.professional_code = v_code
      );

      if v_attempts >= 20 then
        raise exception 'unable to generate a unique professional code for profile %', r.id;
      end if;
    end loop;

    update public.profiles set professional_code = v_code where id = r.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Protect professional_code from direct client writes
-- ---------------------------------------------------------------------------
-- Extends the existing id/role protection (see 20260812192031) so
-- professional_code is likewise system-controlled: an authenticated user can
-- never set or change their own (or, since UPDATE is row-scoped by RLS to
-- their own profile, anyone's) professional_code through the Data API.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    new.id = old.id;
    new.role = old.role;
    new.professional_code = old.professional_code;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Exact-match professional lookup RPC
-- ---------------------------------------------------------------------------
-- public.profiles' "Users can view own profile" SELECT policy restricts the
-- calling patient to their own row, so a SECURITY DEFINER function is
-- required to resolve an arbitrary professional_code -- exactly the same
-- pattern already used by private.profile_has_role. This function must live
-- in `public` (per supabase/config.toml api.schemas) to be callable via the
-- Data API as an RPC.
--
-- Enumeration resistance: exact match only (no ilike/pattern matching), at
-- most one row, only id + full_name returned (never email, role text,
-- account timestamps or other authorizations), and every non-match --
-- unknown code, a patient profile, any other role -- produces the exact same
-- empty result so the caller cannot distinguish why a code did not resolve.
create or replace function public.find_medical_professional_by_code(p_code text)
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select profiles.id, profiles.full_name
  from public.profiles
  where profiles.role = 'medical'::public.user_role
    and profiles.professional_code = upper(btrim(p_code))
  limit 1;
$$;

comment on function public.find_medical_professional_by_code(text) is
  'Exact-match lookup of a persisted medical-team profile by its shareable professional_code. Returns at most one row with only id and full_name -- no email, no role text, no patient profiles, no other authorization relationships. SECURITY DEFINER bypasses the profiles SELECT policy (scoped to the caller''s own row) but exposes no data beyond this minimal summary.';

revoke all on function public.find_medical_professional_by_code(text) from public;
revoke all on function public.find_medical_professional_by_code(text) from anon;
grant execute on function public.find_medical_professional_by_code(text) to authenticated;
