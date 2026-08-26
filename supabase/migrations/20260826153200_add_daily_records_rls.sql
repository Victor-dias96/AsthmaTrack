-- Grants and Row Level Security policies for public.daily_records.
-- Authenticated users may only access rows they own (patient_id = auth.uid()).
-- Anonymous access stays fully revoked. Medical-team access is out of scope.

revoke all on public.daily_records from anon;
revoke all on public.daily_records from authenticated;
grant select, insert, update, delete on public.daily_records to authenticated;

create policy "Users can select own daily records"
on public.daily_records
for select
to authenticated
using (patient_id = (select auth.uid()));

create policy "Users can insert own daily records"
on public.daily_records
for insert
to authenticated
with check (patient_id = (select auth.uid()));

create policy "Users can update own daily records"
on public.daily_records
for update
to authenticated
using (patient_id = (select auth.uid()))
with check (patient_id = (select auth.uid()));

create policy "Users can delete own daily records"
on public.daily_records
for delete
to authenticated
using (patient_id = (select auth.uid()));

comment on table public.daily_records is
  'Patient daily asthma records (PEF and symptom severity). RLS restricts authenticated users to their own rows via patient_id = auth.uid(); anon has no privileges.';
