-- Issue 131: restrict public.daily_records RLS policies to persisted patients.
--
-- The original policies (20260826153200_add_daily_records_rls.sql) checked
-- only ownership (patient_id = auth.uid()). Because the table grants allow
-- authenticated users to insert, update and delete, a persisted
-- medical-team profile could insert a self-owned daily record. Medical-team
-- access to patient health data is strictly read-only and goes exclusively
-- through the authorization-checked SECURITY DEFINER RPCs.
--
-- Each policy now requires BOTH:
--   1. ownership:       patient_id = (select auth.uid())
--   2. persisted role:  private.profile_has_role(auth.uid(), 'patient')
--
-- private.profile_has_role is the existing boolean-only SECURITY DEFINER
-- helper (fixed search_path = public). It reads public.profiles only, so it
-- cannot recurse into daily_records RLS. The role comes from the persisted
-- public.profiles row, never from JWT user_metadata.
--
-- Table grants are intentionally unchanged. Medical-team users still get no
-- direct daily_records SELECT, and the medical read RPCs are untouched.

drop policy "Users can select own daily records" on public.daily_records;
drop policy "Users can insert own daily records" on public.daily_records;
drop policy "Users can update own daily records" on public.daily_records;
drop policy "Users can delete own daily records" on public.daily_records;

create policy "Users can select own daily records"
on public.daily_records
for select
to authenticated
using (
  patient_id = (select auth.uid())
  and private.profile_has_role((select auth.uid()), 'patient'::public.user_role)
);

create policy "Users can insert own daily records"
on public.daily_records
for insert
to authenticated
with check (
  patient_id = (select auth.uid())
  and private.profile_has_role((select auth.uid()), 'patient'::public.user_role)
);

-- WITH CHECK repeats the ownership predicate, so ownership cannot be
-- transferred by an UPDATE.
create policy "Users can update own daily records"
on public.daily_records
for update
to authenticated
using (
  patient_id = (select auth.uid())
  and private.profile_has_role((select auth.uid()), 'patient'::public.user_role)
)
with check (
  patient_id = (select auth.uid())
  and private.profile_has_role((select auth.uid()), 'patient'::public.user_role)
);

create policy "Users can delete own daily records"
on public.daily_records
for delete
to authenticated
using (
  patient_id = (select auth.uid())
  and private.profile_has_role((select auth.uid()), 'patient'::public.user_role)
);

comment on table public.daily_records is
  'Patient daily asthma records (PEF and symptom severity). RLS restricts authenticated users to their own rows via patient_id = auth.uid() and requires a persisted patient role in public.profiles for every command; medical-team profiles have no direct access and read only through authorization-checked RPCs; anon has no privileges.';

