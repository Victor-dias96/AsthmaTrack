-- Issue 130: Patient A versus Patient B isolation enforced by the database
-- alone, independent of every application-level filter.
--
-- Local only: run with `npx supabase test db` against the local stack
-- started by `npx supabase start`. Never run against a linked or hosted
-- project. Everything happens inside one transaction that is rolled back,
-- so no fixture, user or record survives the run.
--
-- The postgres role only seeds the fictional fixtures below. Every
-- assertion about access runs as the real `authenticated` or `anon` API
-- role with request JWT claims, exactly as PostgREST would; service_role is
-- never used.

begin;

create extension if not exists pgtap with schema extensions;

select plan(31);

-- ---------------------------------------------------------------------------
-- Fictional fixtures (setup only, never the actor under test)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role, raw_user_meta_data)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'paciente-a.issue130@example.com',
    'authenticated',
    'authenticated',
    '{"full_name": "Paciente Fictício Alfa"}'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'paciente-b.issue130@example.com',
    'authenticated',
    'authenticated',
    '{"full_name": "Paciente Fictício Beta"}'
  );

insert into public.daily_records (id, patient_id, recorded_at, pef_value, had_attack, used_rescue_medication, notes)
values
  ('a1a1a1a1-0000-4000-8000-0000000000a1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now() - interval '26 hours', 410, true, true, 'Nota fictícia Alfa um'),
  ('a2a2a2a2-0000-4000-8000-0000000000a2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now() - interval '74 hours', 430, false, false, 'Nota fictícia Alfa dois'),
  ('b1b1b1b1-0000-4000-8000-0000000000b1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', now() - interval '2 hours', 260, true, true, 'Nota fictícia Beta um'),
  ('b2b2b2b2-0000-4000-8000-0000000000b2', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', now() - interval '50 hours', 275, true, true, 'Nota fictícia Beta dois');

-- ---------------------------------------------------------------------------
-- Catalog posture
-- ---------------------------------------------------------------------------

select ok(
  (select relrowsecurity from pg_class where oid = 'public.daily_records'::regclass),
  'RLS is enabled on public.daily_records'
);

select policies_are(
  'public',
  'daily_records',
  array[
    'Users can select own daily records',
    'Users can insert own daily records',
    'Users can update own daily records',
    'Users can delete own daily records'
  ],
  'daily_records has only the four owner policies'
);

select table_privs_are(
  'public', 'daily_records', 'anon', array[]::text[],
  'anon has no privilege on daily_records'
);

select table_privs_are(
  'public', 'daily_records', 'authenticated',
  array['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  'authenticated has only CRUD on daily_records (no TRUNCATE, REFERENCES or TRIGGER)'
);

-- ---------------------------------------------------------------------------
-- Patient A
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}';

select results_eq(
  $$select count(*)::int from public.daily_records$$,
  array[2],
  'patient A reads only their own two records'
);

select is_empty(
  $$select id from public.daily_records where patient_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  'patient A cannot read patient B rows by patient_id'
);

select is_empty(
  $$select id from public.daily_records where id = 'b1b1b1b1-0000-4000-8000-0000000000b1'$$,
  'patient A cannot read a patient B row by record id'
);

select throws_ok(
  $$insert into public.daily_records (patient_id, pef_value, notes)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 777, 'Nota fictícia forjada')$$,
  '42501',
  null,
  'patient A cannot insert a record owned by patient B'
);

select lives_ok(
  $$update public.daily_records set pef_value = 999
    where id = 'b1b1b1b1-0000-4000-8000-0000000000b1'$$,
  'updating a patient B record as patient A matches zero rows'
);

select lives_ok(
  $$delete from public.daily_records
    where id = 'b2b2b2b2-0000-4000-8000-0000000000b2'$$,
  'deleting a patient B record as patient A matches zero rows'
);

select throws_ok(
  $$update public.daily_records set patient_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    where id = 'a1a1a1a1-0000-4000-8000-0000000000a1'$$,
  '42501',
  null,
  'patient A cannot transfer their own record to patient B'
);

select results_eq(
  $$select patient_id::text from public.daily_records where id = 'a1a1a1a1-0000-4000-8000-0000000000a1'$$,
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
  'the record patient A tried to transfer is still owned by patient A'
);

select lives_ok(
  $$update public.daily_records set pef_value = 415
    where id = 'a1a1a1a1-0000-4000-8000-0000000000a1'$$,
  'patient A can update their own record'
);

select results_eq(
  $$select pef_value from public.daily_records where id = 'a1a1a1a1-0000-4000-8000-0000000000a1'$$,
  array[415],
  'patient A own update persisted'
);

select lives_ok(
  $$insert into public.daily_records (id, patient_id, pef_value)
    values ('a3a3a3a3-0000-4000-8000-0000000000a3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 420)$$,
  'patient A can insert their own record'
);

select lives_ok(
  $$delete from public.daily_records where id = 'a3a3a3a3-0000-4000-8000-0000000000a3'$$,
  'patient A can delete their own record'
);

select is_empty(
  $$select id from public.daily_records where id = 'a3a3a3a3-0000-4000-8000-0000000000a3'$$,
  'patient A own delete persisted'
);

select is_empty(
  $$select * from public.get_medical_authorized_patient_latest_records('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')$$,
  'patient A gets nothing from the medical latest-records function for patient B'
);

select is_empty(
  $$select * from public.get_medical_authorized_patient_period_records(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '-infinity'::timestamptz, 'infinity'::timestamptz)$$,
  'patient A gets nothing from the medical period-records function for patient B'
);

select is_empty(
  $$select * from public.get_patient_active_access_authorizations('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')$$,
  'patient A cannot list patient B access authorizations'
);

-- Known finding (see Issue 130 report): the table-wide INSERT grant lets a
-- patient choose `id`, so a primary-key collision reveals whether an
-- already-known record id exists. No row data is exposed. Stays TODO until a
-- reviewed forward-only migration narrows the INSERT/UPDATE column grants.
select todo_start('daily_records INSERT/UPDATE grants still include the id column');

select throws_ok(
  $$insert into public.daily_records (id, patient_id, pef_value)
    values ('b1b1b1b1-0000-4000-8000-0000000000b1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 777)$$,
  '42501',
  null,
  'patient A cannot probe a patient B record id through a primary-key collision'
);

select todo_end();

-- ---------------------------------------------------------------------------
-- Patient B (verification through B's own context, never an admin role)
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
set local request.jwt.claims = '{"sub": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "role": "authenticated"}';

select results_eq(
  $$select id::text, pef_value from public.daily_records order by id$$,
  $$values ('b1b1b1b1-0000-4000-8000-0000000000b1', 260),
           ('b2b2b2b2-0000-4000-8000-0000000000b2', 275)$$,
  'patient B records survived patient A update and delete attempts unchanged'
);

select is_empty(
  $$select id from public.daily_records where pef_value = 777$$,
  'no record forged by patient A was created for patient B'
);

select is_empty(
  $$select id from public.daily_records where patient_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  'patient B cannot read patient A rows'
);

select lives_ok(
  $$update public.daily_records set pef_value = 280
    where id = 'b2b2b2b2-0000-4000-8000-0000000000b2'$$,
  'patient B can update their own record'
);

select results_eq(
  $$select pef_value from public.daily_records where id = 'b2b2b2b2-0000-4000-8000-0000000000b2'$$,
  array[280],
  'patient B own update persisted'
);

-- ---------------------------------------------------------------------------
-- Anonymous caller
-- ---------------------------------------------------------------------------

set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $$select id from public.daily_records$$,
  '42501',
  null,
  'anon cannot read daily_records'
);

select throws_ok(
  $$insert into public.daily_records (patient_id, pef_value)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 300)$$,
  '42501',
  null,
  'anon cannot insert daily_records'
);

select throws_ok(
  $$update public.daily_records set pef_value = 300$$,
  '42501',
  null,
  'anon cannot update daily_records'
);

select throws_ok(
  $$delete from public.daily_records$$,
  '42501',
  null,
  'anon cannot delete daily_records'
);

select throws_ok(
  $$select * from public.get_medical_authorized_patient_latest_records('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  '42501',
  null,
  'anon cannot execute the medical record functions'
);

select * from finish();

rollback;
