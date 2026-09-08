-- Issue 109: extend the Issue 107 authorized-patient lookup so a
-- medical-team professional can see each actively authorized patient's
-- latest PEF value and latest recorded_at -- and nothing else from
-- public.daily_records.
--
-- Health-data access audit (before this migration):
--   - public.daily_records SELECT is still owner-only
--     (patient_id = auth.uid(); see 20260826153200). Authenticated
--     medical-team callers cannot read another patient's rows.
--   - public.get_medical_authorized_patients (20260908140000) returns
--     authorization + patient display name only. It explicitly does not
--     read daily_records.
--   - Authorization-table visibility does not grant daily_records access.
--   - Issue 102 reserved medical health-data reads for the corresponding
--     read-only issues. Issue 109 is the first of those, and it needs only
--     these two latest-record fields -- not a broad medical SELECT policy
--     (that would expose notes, symptoms, attacks and full histories, which
--     belong to Issues 110-112).
--
-- Why a SECURITY DEFINER function remains required:
--   1. public.profiles' "Users can view own profile" policy still hides
--      linked patient names from the professional (same Issue 107 reason).
--   2. public.daily_records owner-only SELECT still hides the latest
--      record from the professional.
--   A new daily_records SELECT policy would be broader than this issue:
--   it would let medical users read complete rows (notes, symptoms, etc.)
--   through the Data API. This migration therefore does not add any
--   daily_records policy, grant, INSERT, UPDATE or DELETE.
--
-- Replacement of public.get_medical_authorized_patients is required
-- because PostgreSQL CREATE OR REPLACE cannot change a function's return
-- type. The previous no-argument signature is dropped and recreated with
-- two additional nullable columns. Callers still pass no professional id
-- and no patient id; auth.uid() remains the only identity source.
--
-- Recursion: this function is SECURITY DEFINER, so it does not re-enter
-- RLS on profiles, patient_access_authorizations or daily_records. The
-- only helper it calls is private.profile_has_role, which reads
-- public.profiles only (no authorization rows, no daily_records). Existing
-- daily_records policies do not query authorization rows. No policy
-- recursion is introduced, RLS is not disabled, and service_role is not
-- used.

drop function if exists public.get_medical_authorized_patients();

create function public.get_medical_authorized_patients()
returns table (
  authorization_id uuid,
  patient_id uuid,
  patient_full_name text,
  granted_at timestamptz,
  latest_pef_value integer,
  latest_recorded_at timestamptz
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
    paa.created_at as granted_at,
    latest.pef_value as latest_pef_value,
    latest.recorded_at as latest_recorded_at
  from public.patient_access_authorizations paa
  join public.profiles
    on profiles.id = paa.patient_id
  left join lateral (
    -- One latest valid daily record per authorized patient. Ordered by
    -- recorded_at (not created_at / updated_at / PEF magnitude) with the
    -- primary key as the deterministic tie-break. Selects only pef_value
    -- and recorded_at -- never notes, symptoms, attacks, medication,
    -- record id, created_at or updated_at.
    select
      dr.pef_value,
      dr.recorded_at
    from public.daily_records dr
    where
      dr.patient_id = paa.patient_id
      and dr.pef_value > 0
    order by dr.recorded_at desc, dr.id desc
    limit 1
  ) latest on true
  where
    -- Authoritative filter: SECURITY DEFINER bypasses RLS, so ownership is
    -- enforced here, directly against the caller's own verified identity --
    -- never a browser-supplied professional id, since this function
    -- accepts no arguments at all.
    paa.professional_id = (select auth.uid())
    and paa.revoked_at is null
    -- The caller must be a persisted medical-team profile. Re-checked on
    -- every call (never cached), so a caller who loses the medical role
    -- immediately loses this visibility, including latest-record fields,
    -- even though the underlying authorization rows remain unchanged.
    and private.profile_has_role((select auth.uid()), 'medical'::public.user_role)
  order by paa.created_at desc, paa.id desc;
$$;

comment on function public.get_medical_authorized_patients() is
  'Returns the calling medical-team professional''s own active (revoked_at is null) patient access authorizations with each linked patient''s minimal display name and the latest valid daily-record summary (pef_value and recorded_at only). Derives the caller from auth.uid() only (accepts no arguments) and re-verifies the caller''s persisted medical role on every call. Returns no notes, symptoms, attacks, medication, email, unrelated profiles, revoked relationships, or complete record rows. Used by Issue 109''s authorized-patient list.';

revoke all on function public.get_medical_authorized_patients() from public;
revoke all on function public.get_medical_authorized_patients() from anon;
grant execute on function public.get_medical_authorized_patients() to authenticated;
