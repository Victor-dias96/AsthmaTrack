-- Issue 107: minimal, safe lookup so a medical-team professional can see
-- which patients currently hold an active authorization directed to their
-- own identity, including each patient's minimal display name.
--
-- Symmetric counterpart to Issue 104's
-- public.get_patient_active_access_authorizations (20260906120000):
-- public.profiles' "Users can view own profile" policy (see
-- 20260812192031) restricts every authenticated caller to their own row,
-- so a plain nested-select query from the professional's session (e.g.
-- `.select("*, patient:profiles!patient_id(full_name)")`) would always
-- resolve the patient's profile to null under RLS -- the professional can
-- read their own active patient_access_authorizations rows (Issue 102's
-- "Professionals can view active access authorizations" policy), but never
-- the linked patient's profiles row. A SECURITY DEFINER function is
-- required to resolve that minimal patient summary safely, exactly the
-- same pattern already used by private.profile_has_role,
-- public.find_medical_professional_by_code and
-- public.get_patient_active_access_authorizations.
--
-- This migration does not broaden public.profiles visibility in any way:
-- no new policy is added, and this function is not a patient directory --
-- it returns only the patient profiles linked to the *caller's own* active
-- authorizations, and only after confirming the caller is a persisted
-- medical-team profile. It does not grant medical-team access to
-- public.daily_records or any other patient health data.

create or replace function public.get_medical_authorized_patients()
returns table (
  authorization_id uuid,
  patient_id uuid,
  patient_full_name text,
  granted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    paa.id as authorization_id,
    paa.patient_id,
    profiles.full_name as patient_full_name,
    paa.created_at as granted_at
  from public.patient_access_authorizations paa
  join public.profiles on profiles.id = paa.patient_id
  where
    -- Authoritative filter: SECURITY DEFINER bypasses RLS, so ownership is
    -- enforced here, directly against the caller's own verified identity --
    -- never a browser-supplied professional id, since this function
    -- accepts no arguments at all.
    paa.professional_id = (select auth.uid())
    and paa.revoked_at is null
    -- The caller must be a persisted medical-team profile. Re-checked on
    -- every call (never cached), so a caller who loses the medical role
    -- immediately loses this visibility even though the underlying
    -- authorization rows remain unchanged. Reuses the existing boolean-only
    -- role helper instead of duplicating role-check logic.
    and private.profile_has_role((select auth.uid()), 'medical'::public.user_role)
  order by paa.created_at desc, paa.id desc;
$$;

comment on function public.get_medical_authorized_patients() is
  'Returns the calling medical-team professional''s own active (revoked_at is null) patient access authorizations with each linked patient''s minimal display name. Derives the caller from auth.uid() only (accepts no arguments) and re-verifies the caller''s persisted medical role on every call. Returns no health data, no email, no unrelated profiles, and no revoked relationships. Used by Issue 107''s authorized-patient list.';

revoke all on function public.get_medical_authorized_patients() from public;
revoke all on function public.get_medical_authorized_patients() from anon;
grant execute on function public.get_medical_authorized_patients() to authenticated;
