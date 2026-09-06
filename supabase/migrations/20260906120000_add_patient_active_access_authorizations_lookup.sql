-- Issue 104: minimal, safe lookup so a patient can see which medical-team
-- profiles currently hold an active authorization they granted, including
-- each professional's display name.
--
-- Why a database helper is required: public.profiles' "Users can view own
-- profile" SELECT policy (see 20260812192031) restricts every authenticated
-- caller to their own row. A plain nested-select query from the patient's
-- session (e.g. `.select("*, professional:profiles!professional_id(full_name)")`)
-- would therefore always resolve the professional's profile to null under
-- RLS -- the patient can read their own patient_access_authorizations rows
-- (Issue 102's "Patients can view own access authorizations" policy), but
-- never the linked professional's profiles row. A SECURITY DEFINER function
-- is required to resolve that minimal professional summary safely, exactly
-- the same pattern already used by private.profile_has_role and
-- public.find_medical_professional_by_code (20260904160000 / 20260905103000).
--
-- This migration does not broaden public.profiles visibility in any way: no
-- new policy is added, and this function is not a professional directory --
-- it returns only the professional profiles linked to the *caller's own*
-- active authorizations, never any other profile.

create or replace function public.get_patient_active_access_authorizations(
  p_patient_id uuid
)
returns table (
  authorization_id uuid,
  professional_id uuid,
  professional_full_name text,
  granted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    paa.id as authorization_id,
    paa.professional_id,
    profiles.full_name as professional_full_name,
    paa.created_at as granted_at
  from public.patient_access_authorizations paa
  join public.profiles on profiles.id = paa.professional_id
  where
    -- Authoritative filter: SECURITY DEFINER bypasses RLS, so ownership is
    -- enforced here, directly against the caller's own verified identity --
    -- never against the p_patient_id argument alone (see below).
    paa.patient_id = (select auth.uid())
    -- p_patient_id is accepted only so the caller's already-verified server
    -- identity is passed explicitly (never a browser-supplied value -- see
    -- get_patient_active_access_authorizations() in
    -- src/features/access-authorizations/server/). It is always ANDed with,
    -- never substituted for, the auth.uid() check above: passing any other
    -- patient's id here can never widen the result beyond the caller's own
    -- rows, it can only narrow it (typically to zero rows) if it mismatches.
    and paa.patient_id = p_patient_id
    and paa.revoked_at is null
  order by paa.created_at desc, paa.id desc;
$$;

comment on function public.get_patient_active_access_authorizations(uuid) is
  'Returns the calling patient''s own active (revoked_at is null) access authorizations with each linked professional''s minimal display name. Ownership is enforced against auth.uid() regardless of the p_patient_id argument, so no caller can read another patient''s authorizations or enumerate professional profiles. Returns no patient profiles, no health data, no email. Used by Issue 104''s active-access list.';

revoke all on function public.get_patient_active_access_authorizations(uuid) from public;
revoke all on function public.get_patient_active_access_authorizations(uuid) from anon;
grant execute on function public.get_patient_active_access_authorizations(uuid) to authenticated;
