-- Issue 110: read-only medical dashboard data for one actively authorized
-- patient.
--
-- Extends the Issue 109 secure-read pattern (SECURITY DEFINER functions that
-- derive the caller from auth.uid() and independently re-verify the
-- persisted medical role and an active authorization on every call) to the
-- small, bounded record sets the medical dashboard needs:
--   1. get_medical_authorized_patient_latest_records: the patient's latest
--      up-to-three overall daily records, paired with the patient's display
--      name. Used for "Último PEF", "Último registro" and the recent-
--      records section.
--   2. get_medical_authorized_patient_period_records: the patient's daily
--      records within the caller-supplied, already-validated period
--      boundaries (America/Maceio, 7/30/90 days, computed in application
--      code by the same helper the patient dashboard uses). Used for the
--      four period metrics and the PEF chart.
--
-- Health-data access audit (before this migration):
--   - public.daily_records SELECT is still owner-only
--     (patient_id = auth.uid(); see 20260826153200). Authenticated
--     medical-team callers cannot read another patient's rows directly.
--   - public.get_medical_authorized_patients (20260908180000) returns only
--     each authorized patient's latest PEF + recorded_at for the list
--     cards -- not a bounded record set suitable for period metrics or a
--     chart.
--
-- Why SECURITY DEFINER remains required (same reasoning as 20260908180000):
--   - public.profiles' "Users can view own profile" policy still hides the
--     linked patient's display name from the professional.
--   - public.daily_records owner-only SELECT still hides every record from
--     the professional.
--   Neither function adds a new daily_records or profiles RLS policy --
--   broadening RLS would let medical users read complete rows (notes, etc.)
--   through the Data API, which is explicitly out of scope until Issue 113
--   confirms no medical write/broad-read surface exists. Medical health-data
--   access remains exclusively through these narrow, bounded functions.
--
-- Recursion: both functions are SECURITY DEFINER, so they do not re-enter
-- RLS on profiles, patient_access_authorizations or daily_records. The only
-- helper called is private.profile_has_role, which reads public.profiles
-- only (no authorization rows, no daily_records). No policy recursion is
-- introduced, RLS is not disabled anywhere, and service_role is not used.

-- ---------------------------------------------------------------------------
-- 1. Latest up-to-three overall records + patient display name
-- ---------------------------------------------------------------------------
-- One row per one of the patient's latest three valid daily records
-- (ordered by recorded_at desc, id desc -- deterministic tie-break, mirrors
-- the patient dashboard's own query). `left join lateral ... on true`
-- guarantees exactly one row even when the patient has zero records, so the
-- caller can distinguish "authorized, zero records" (one row, every record
-- column null) from "not authorized" (zero rows) without a second query.
create or replace function public.get_medical_authorized_patient_latest_records(
  p_patient_id uuid
)
returns table (
  patient_full_name text,
  recorded_at timestamptz,
  pef_value integer,
  cough_severity smallint,
  wheezing_severity smallint,
  shortness_of_breath_severity smallint,
  chest_tightness_severity smallint,
  had_attack boolean,
  used_rescue_medication boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.full_name as patient_full_name,
    latest.recorded_at,
    latest.pef_value,
    latest.cough_severity,
    latest.wheezing_severity,
    latest.shortness_of_breath_severity,
    latest.chest_tightness_severity,
    latest.had_attack,
    latest.used_rescue_medication
  from public.patient_access_authorizations paa
  join public.profiles
    on profiles.id = paa.patient_id
  left join lateral (
    select
      dr.recorded_at,
      dr.pef_value,
      dr.cough_severity,
      dr.wheezing_severity,
      dr.shortness_of_breath_severity,
      dr.chest_tightness_severity,
      dr.had_attack,
      dr.used_rescue_medication
    from public.daily_records dr
    where dr.patient_id = paa.patient_id
    order by dr.recorded_at desc, dr.id desc
    limit 3
  ) latest on true
  where
    -- Authoritative filter: SECURITY DEFINER bypasses RLS, so ownership is
    -- enforced here, directly against the caller's own verified identity --
    -- never a browser-supplied professional id (this function takes none)
    -- and never the p_patient_id argument alone.
    paa.patient_id = p_patient_id
    and paa.professional_id = (select auth.uid())
    and paa.revoked_at is null
    -- The caller must be a persisted medical-team profile, re-checked on
    -- every call (never cached) -- a caller who loses the medical role, or
    -- a patient who revokes access, immediately loses this visibility.
    and private.profile_has_role((select auth.uid()), 'medical'::public.user_role)
    -- The target must still be a persisted patient profile. A malformed or
    -- retargeted authorization row (e.g. pointing at a non-patient profile)
    -- returns zero rows rather than any data.
    and private.profile_has_role(paa.patient_id, 'patient'::public.user_role);
$$;

comment on function public.get_medical_authorized_patient_latest_records(uuid) is
  'Returns the calling medical professional''s actively authorized patient''s latest up-to-three daily records (Issue 110), each row paired with the patient''s display name, or zero rows when no active authorization exists, the caller lacks the medical role, or the target is not a persisted patient profile. When the patient has zero daily records, returns exactly one row with the patient name and every record column null. Derives the caller from auth.uid() only. Returns no notes, patient_id, record id, email or unrelated profile.';

revoke all on function public.get_medical_authorized_patient_latest_records(uuid) from public;
revoke all on function public.get_medical_authorized_patient_latest_records(uuid) from anon;
grant execute on function public.get_medical_authorized_patient_latest_records(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Selected-period records for period metrics and the PEF chart
-- ---------------------------------------------------------------------------
-- p_range_start/p_range_end are pre-computed, already-validated ISO instants
-- from the same America/Maceio period-boundary helper the patient dashboard
-- uses (inclusive start, exclusive end) -- never a client-supplied SQL
-- fragment, never an arbitrary custom range. Ordered oldest first, matching
-- the patient dashboard's own period query, so chart points arrive already
-- chronological.
create or replace function public.get_medical_authorized_patient_period_records(
  p_patient_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz
)
returns table (
  recorded_at timestamptz,
  pef_value integer,
  cough_severity smallint,
  wheezing_severity smallint,
  shortness_of_breath_severity smallint,
  chest_tightness_severity smallint,
  had_attack boolean,
  used_rescue_medication boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dr.recorded_at,
    dr.pef_value,
    dr.cough_severity,
    dr.wheezing_severity,
    dr.shortness_of_breath_severity,
    dr.chest_tightness_severity,
    dr.had_attack,
    dr.used_rescue_medication
  from public.daily_records dr
  where
    dr.patient_id = p_patient_id
    and dr.recorded_at >= p_range_start
    and dr.recorded_at < p_range_end
    -- Authoritative filter, re-checked on every call: an active
    -- authorization from p_patient_id to the caller's own auth.uid().
    and exists (
      select 1
      from public.patient_access_authorizations paa
      where paa.patient_id = p_patient_id
        and paa.professional_id = (select auth.uid())
        and paa.revoked_at is null
    )
    and private.profile_has_role((select auth.uid()), 'medical'::public.user_role)
    and private.profile_has_role(p_patient_id, 'patient'::public.user_role)
  order by dr.recorded_at asc, dr.id asc;
$$;

comment on function public.get_medical_authorized_patient_period_records(uuid, timestamptz, timestamptz) is
  'Returns the calling medical professional''s actively authorized patient''s daily records with recorded_at in [p_range_start, p_range_end) (Issue 110), ordered oldest first, or zero rows when no active authorization exists, the caller lacks the medical role, or the target is not a persisted patient profile. Derives the caller from auth.uid() only. Selects only the columns the dashboard period metrics and PEF chart require -- no notes, patient_id, record id, email or unrelated profile.';

revoke all on function public.get_medical_authorized_patient_period_records(uuid, timestamptz, timestamptz) from public;
revoke all on function public.get_medical_authorized_patient_period_records(uuid, timestamptz, timestamptz) from anon;
grant execute on function public.get_medical_authorized_patient_period_records(uuid, timestamptz, timestamptz) to authenticated;
