-- Issue 131: medical authorization, professional isolation, revocation
-- and read-only enforcement, proven against the local database.
--
-- Run with `npx supabase test db` against `npx supabase start`.
-- Never run against a linked or hosted project. The postgres role only
-- seeds fixtures. Every access assertion runs as authenticated or anon.
-- service_role is never the actor. The transaction rolls back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(79);

-- Fictional actors. They exist only inside this transaction.
-- patient_a 11111111-1111-4111-8111-111111111111
-- patient_b 22222222-2222-4222-8222-222222222222
-- medical_a 33333333-3333-4333-8333-333333333333
-- medical_b 44444444-4444-4444-8444-444444444444

insert into auth.users (id, email, aud, role, raw_user_meta_data)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'paciente-a.issue131@example.com',
    'authenticated',
    'authenticated',
    '{"full_name": "Paciente Fictício Alfa"}'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'paciente-b.issue131@example.com',
    'authenticated',
    'authenticated',
    '{"full_name": "Paciente Fictício Beta"}'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'medico-a.issue131@example.com',
    'authenticated',
    'authenticated',
    '{"full_name": "Profissional Fictício Alfa"}'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'medico-b.issue131@example.com',
    'authenticated',
    'authenticated',
    '{"full_name": "Profissional Fictício Beta"}'
  );

update public.profiles
set
  role = case
    when id in (
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444'
    ) then 'medical'::public.user_role
    else role
  end,
  full_name = case id
    when '11111111-1111-4111-8111-111111111111' then 'Paciente Fictício Alfa'
    when '22222222-2222-4222-8222-222222222222' then 'Paciente Fictício Beta'
    when '33333333-3333-4333-8333-333333333333' then 'Profissional Fictício Alfa'
    when '44444444-4444-4444-8444-444444444444' then 'Profissional Fictício Beta'
  end
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444'
);

insert into public.daily_records (
  id, patient_id, recorded_at, pef_value, had_attack, used_rescue_medication, notes
)
values
  (
    'a1111111-0000-4000-8000-0000000000a1',
    '11111111-1111-4111-8111-111111111111',
    now() - interval '26 hours',
    410, true, true, 'Nota fictícia Alfa um'
  ),
  (
    'a2222222-0000-4000-8000-0000000000a2',
    '11111111-1111-4111-8111-111111111111',
    now() - interval '74 hours',
    430, false, false, 'Nota fictícia Alfa dois'
  ),
  (
    'b1111111-0000-4000-8000-0000000000b1',
    '22222222-2222-4222-8222-222222222222',
    now() - interval '2 hours',
    260, true, true, 'Nota fictícia Beta um'
  ),
  (
    'b2222222-0000-4000-8000-0000000000b2',
    '22222222-2222-4222-8222-222222222222',
    now() - interval '50 hours',
    275, true, true, 'Nota fictícia Beta dois'
  );

insert into public.patient_access_authorizations (id, patient_id, professional_id)
values
  (
    'c1111111-0000-4000-8000-0000000000c1',
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333333'
  ),
  (
    'c2222222-0000-4000-8000-0000000000c2',
    '22222222-2222-4222-8222-222222222222',
    '44444444-4444-4444-8444-444444444444'
  );

-- Accepts either a silent zero-row write or SQLSTATE 42501. A write that
-- changes a row returns false. Unexpected errors propagate.
create function pg_temp.mutation_blocked(statement text)
returns boolean
language plpgsql
as $$
declare
  affected integer;
begin
  execute statement;
  get diagnostics affected = row_count;
  return affected = 0;
exception
  when insufficient_privilege then
    return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalog: grants and function shape. Policies are proven by the runtime
-- assertions below, not by copying them into this file.
-- ---------------------------------------------------------------------------

select ok(
  (select relrowsecurity from pg_class where oid = 'public.daily_records'::regclass),
  'RLS is enabled on daily_records'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.patient_access_authorizations'::regclass),
  'RLS is enabled on patient_access_authorizations'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'RLS is enabled on profiles'
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

select policies_are(
  'public',
  'patient_access_authorizations',
  array[
    'Patients can view own access authorizations',
    'Professionals can view active access authorizations',
    'Patients can insert own access authorizations',
    'Patients can revoke own access authorizations'
  ],
  'authorizations have only the patient-write and professional-read policies'
);

select table_privs_are(
  'public', 'daily_records', 'anon', array[]::text[],
  'anon has no privilege on daily_records'
);

select table_privs_are(
  'public', 'daily_records', 'authenticated',
  array['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  'authenticated has CRUD grants on daily_records'
);

select table_privs_are(
  'public', 'patient_access_authorizations', 'anon', array[]::text[],
  'anon has no privilege on authorizations'
);

select table_privs_are(
  'public', 'profiles', 'anon', array[]::text[],
  'anon has no privilege on profiles'
);

select ok(
  has_table_privilege('authenticated', 'public.patient_access_authorizations', 'SELECT')
  and has_column_privilege('authenticated', 'public.patient_access_authorizations', 'patient_id', 'INSERT')
  and has_column_privilege('authenticated', 'public.patient_access_authorizations', 'professional_id', 'INSERT')
  and not has_column_privilege('authenticated', 'public.patient_access_authorizations', 'id', 'INSERT')
  and has_column_privilege('authenticated', 'public.patient_access_authorizations', 'revoked_at', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.patient_access_authorizations', 'patient_id', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.patient_access_authorizations', 'professional_id', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.patient_access_authorizations', 'DELETE')
  and not has_table_privilege('anon', 'public.patient_access_authorizations', 'SELECT'),
  'authorization grants allow patient identity insert and revoked_at update only'
);

select ok(
  (
    select bool_and(
      not has_function_privilege('anon', p.oid, 'EXECUTE')
      and not has_function_privilege('public', p.oid, 'EXECUTE')
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
      and p.prosecdef
      and p.provolatile = 's'
      and p.proconfig @> array['search_path=public']
      and p.prosrc ~ 'revoked_at is null'
      and p.prosrc ~ 'auth.uid()'
      and p.prosrc ~ 'profile_has_role'
      and p.prosrc !~* 'insert into'
      and p.prosrc !~* 'delete from'
      and p.prosrc !~* 'execute[[:space:]]+format'
      and pg_get_function_result(p.oid) !~* 'notes'
      and pg_get_function_result(p.oid) !~* 'email'
    )
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'get_medical_%'
  ),
  'medical RPCs are stable security-definer reads with a fixed search_path'
);

select ok(
  (
    select count(*) = 3
      and count(*) filter (where p.proname = 'get_medical_authorized_patients') = 1
      and count(*) filter (where p.proname = 'get_medical_authorized_patient_latest_records') = 1
      and count(*) filter (where p.proname = 'get_medical_authorized_patient_period_records') = 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'get_medical_%'
  ),
  'history and report reuse the three medical read RPCs'
);

select ok(
  (select column_default from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_records'
      and column_name = 'id') like '%gen_random_uuid%',
  'daily_records.id is generated by the database'
);

-- Known Issue 130 finding, documented here and still not migrated.
select ok(
  has_column_privilege('authenticated', 'public.daily_records', 'id', 'INSERT')
  and has_column_privilege('authenticated', 'public.daily_records', 'id', 'UPDATE'),
  'authenticated INSERT and UPDATE grants still include daily_records.id'
);

-- ---------------------------------------------------------------------------
-- Medical A, active authorization
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';

select results_eq(
  $$select patient_full_name from public.get_medical_authorized_patients()$$,
  array['Paciente Fictício Alfa'],
  'medical A list returns only patient A'
);

select results_eq(
  $$select count(*)::int
    from public.get_medical_authorized_patient_latest_records('11111111-1111-4111-8111-111111111111')$$,
  array[2],
  'medical A dashboard RPC returns only patient A records'
);

select is_empty(
  $$select patient_full_name
    from public.get_medical_authorized_patient_latest_records('22222222-2222-4222-8222-222222222222')$$,
  'medical A dashboard RPC returns nothing for patient B'
);

select results_eq(
  $$select count(*)::int
    from public.get_medical_authorized_patient_period_records(
      '11111111-1111-4111-8111-111111111111',
      '-infinity'::timestamptz,
      'infinity'::timestamptz
    )$$,
  array[2],
  'medical A period RPC returns only patient A records'
);

select is_empty(
  $$select recorded_at
    from public.get_medical_authorized_patient_period_records(
      '22222222-2222-4222-8222-222222222222',
      '-infinity'::timestamptz,
      'infinity'::timestamptz
    )$$,
  'medical A period RPC returns nothing for patient B'
);

select is_empty(
  $$select id from public.daily_records$$,
  'medical A cannot read daily_records directly'
);

select results_eq(
  $$select patient_id::text from public.patient_access_authorizations$$,
  array['11111111-1111-4111-8111-111111111111'],
  'medical A sees only the active authorization directed to medical A'
);

select is_empty(
  $$select id from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  'medical A cannot read patient A profile'
);

-- ---------------------------------------------------------------------------
-- Medical B
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';

select results_eq(
  $$select patient_full_name from public.get_medical_authorized_patients()$$,
  array['Paciente Fictício Beta'],
  'medical B list returns only patient B'
);

select is_empty(
  $$select patient_full_name
    from public.get_medical_authorized_patient_latest_records('11111111-1111-4111-8111-111111111111')$$,
  'medical B dashboard RPC returns nothing for patient A'
);

select results_eq(
  $$select count(*)::int
    from public.get_medical_authorized_patient_latest_records('22222222-2222-4222-8222-222222222222')$$,
  array[2],
  'medical B dashboard RPC returns only patient B records'
);

select is_empty(
  $$select recorded_at
    from public.get_medical_authorized_patient_period_records(
      '11111111-1111-4111-8111-111111111111',
      now() - interval '90 days',
      now() + interval '1 day'
    )$$,
  'medical B period RPC returns nothing for patient A'
);

select results_eq(
  $$select count(*)::int
    from public.get_medical_authorized_patient_period_records(
      '22222222-2222-4222-8222-222222222222',
      '-infinity'::timestamptz,
      'infinity'::timestamptz
    )$$,
  array[2],
  'medical B period RPC returns only patient B records'
);

select is_empty(
  $$select id from public.daily_records$$,
  'medical B cannot read daily_records directly'
);

-- ---------------------------------------------------------------------------
-- Medical A write denial, including a row owned by medical A's own uid
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';

select throws_ok(
  $$insert into public.daily_records (patient_id, pef_value)
    values ('11111111-1111-4111-8111-111111111111', 350)$$,
  '42501',
  null,
  'medical A cannot insert a daily record for patient A'
);

select throws_ok(
  $$insert into public.daily_records (patient_id, recorded_at, pef_value)
    values ('33333333-3333-4333-8333-333333333333', now(), 350)$$,
  '42501',
  null,
  'medical A cannot insert a daily record owned by medical A auth.uid()'
);

select results_eq(
  $$select count(*)::int from public.daily_records$$,
  array[0],
  'medical A still owns no daily record after the self-insert attempt'
);

select ok(
  pg_temp.mutation_blocked(
    $m$update public.daily_records set pef_value = 1
      where id = 'a1111111-0000-4000-8000-0000000000a1'$m$
  ),
  'medical A cannot update patient A daily record'
);

select ok(
  pg_temp.mutation_blocked(
    $m$delete from public.daily_records
      where id = 'a2222222-0000-4000-8000-0000000000a2'$m$
  ),
  'medical A cannot delete patient A daily record'
);

select ok(
  pg_temp.mutation_blocked(
    $m$update public.daily_records
      set patient_id = '33333333-3333-4333-8333-333333333333'
      where id = 'a1111111-0000-4000-8000-0000000000a1'$m$
  ),
  'medical A cannot transfer a daily record'
);

select ok(
  pg_temp.mutation_blocked(
    $m$update public.profiles
      set full_name = 'Nome forjado'
      where id = '11111111-1111-4111-8111-111111111111'$m$
  ),
  'medical A cannot update patient A profile'
);

select throws_ok(
  $$insert into public.patient_access_authorizations (patient_id, professional_id)
    values (
      '11111111-1111-4111-8111-111111111111',
      '44444444-4444-4444-8444-444444444444'
    )$$,
  '42501',
  null,
  'medical A cannot create an authorization as patient A'
);

select throws_ok(
  $$insert into public.patient_access_authorizations (patient_id, professional_id)
    values (
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444'
    )$$,
  '42501',
  null,
  'medical A cannot create an authorization owned by medical A'
);

select ok(
  pg_temp.mutation_blocked(
    $m$update public.patient_access_authorizations
      set revoked_at = timezone('utc', now())
      where id = 'c1111111-0000-4000-8000-0000000000c1'$m$
  ),
  'medical A cannot set revoked_at'
);

select throws_ok(
  $$update public.patient_access_authorizations
    set patient_id = '33333333-3333-4333-8333-333333333333'
    where id = 'c1111111-0000-4000-8000-0000000000c1'$$,
  '42501',
  null,
  'medical A cannot change authorization patient_id'
);

select throws_ok(
  $$update public.patient_access_authorizations
    set professional_id = '44444444-4444-4444-8444-444444444444'
    where id = 'c1111111-0000-4000-8000-0000000000c1'$$,
  '42501',
  null,
  'medical A cannot change authorization professional_id'
);

select throws_ok(
  $$delete from public.patient_access_authorizations
    where id = 'c1111111-0000-4000-8000-0000000000c1'$$,
  '42501',
  null,
  'medical A cannot delete an authorization'
);

select lives_ok(
  $$update public.profiles
    set role = 'patient'
    where id = '33333333-3333-4333-8333-333333333333'$$,
  'medical A role update is accepted only as a no-op on protected columns'
);

select results_eq(
  $$select role::text from public.profiles$$,
  array['medical'],
  'medical A persisted role stays medical'
);

-- ---------------------------------------------------------------------------
-- Patient A: own data survived, own writes still work, B stays untouched
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select results_eq(
  $$select pef_value from public.daily_records
    where id = 'a1111111-0000-4000-8000-0000000000a1'$$,
  array[410],
  'patient A record was not updated by medical A'
);

select results_eq(
  $$select count(*)::int from public.daily_records
    where id = 'a2222222-0000-4000-8000-0000000000a2'$$,
  array[1],
  'patient A record was not deleted by medical A'
);

select results_eq(
  $$select full_name from public.profiles$$,
  array['Paciente Fictício Alfa'],
  'patient A profile was not modified by medical A'
);

select lives_ok(
  $$insert into public.daily_records (id, patient_id, pef_value)
    values (
      'a3333333-0000-4000-8000-0000000000a3',
      '11111111-1111-4111-8111-111111111111',
      420
    )$$,
  'patient A can insert their own record'
);

select lives_ok(
  $$update public.daily_records set pef_value = 425
    where id = 'a3333333-0000-4000-8000-0000000000a3'$$,
  'patient A can update their own record'
);

select lives_ok(
  $$delete from public.daily_records
    where id = 'a3333333-0000-4000-8000-0000000000a3'$$,
  'patient A can delete their own record'
);

select throws_ok(
  $$insert into public.daily_records (patient_id, pef_value)
    values ('22222222-2222-4222-8222-222222222222', 300)$$,
  '42501',
  null,
  'patient A cannot insert a record for patient B'
);

select ok(
  pg_temp.mutation_blocked(
    $m$update public.patient_access_authorizations
      set revoked_at = timezone('utc', now())
      where id = 'c2222222-0000-4000-8000-0000000000c2'$m$
  ),
  'patient A cannot revoke patient B authorization'
);

select results_eq(
  $$with revoked as (
      update public.patient_access_authorizations
      set revoked_at = timezone('utc', now())
      where id = 'c1111111-0000-4000-8000-0000000000c1'
      returning 1
    )
    select count(*)::int from revoked$$,
  array[1],
  'patient A can revoke the authorization granted to medical A'
);

select results_eq(
  $$select count(*)::int
    from public.patient_access_authorizations
    where revoked_at is not null$$,
  array[1],
  'patient A still sees the revoked authorization'
);

-- ---------------------------------------------------------------------------
-- Revocation blocks the next medical read
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';

select is_empty(
  $$select patient_full_name from public.get_medical_authorized_patients()$$,
  'medical A list is empty after revocation'
);

select is_empty(
  $$select patient_full_name
    from public.get_medical_authorized_patient_latest_records('11111111-1111-4111-8111-111111111111')$$,
  'the previous patient id does not restore dashboard access'
);

select is_empty(
  $$select recorded_at
    from public.get_medical_authorized_patient_period_records(
      '11111111-1111-4111-8111-111111111111',
      '-infinity'::timestamptz,
      'infinity'::timestamptz
    )$$,
  'a wider period does not restore medical A access'
);

select is_empty(
  $$select recorded_at
    from public.get_medical_authorized_patient_period_records(
      '11111111-1111-4111-8111-111111111111',
      now() - interval '7 days',
      now() + interval '1 day'
    )$$,
  'a narrower period does not restore medical A access'
);

select is_empty(
  $$select id from public.patient_access_authorizations$$,
  'medical A cannot read the revoked authorization'
);

select ok(
  pg_temp.mutation_blocked(
    $m$update public.patient_access_authorizations
      set revoked_at = null
      where id = 'c1111111-0000-4000-8000-0000000000c1'$m$
  ),
  'medical A cannot clear revoked_at'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select ok(
  pg_temp.mutation_blocked(
    $m$update public.patient_access_authorizations
      set revoked_at = null
      where id = 'c1111111-0000-4000-8000-0000000000c1'$m$
  ),
  'patient A cannot reactivate a revoked authorization'
);

select results_eq(
  $$select (revoked_at is not null)::int
    from public.patient_access_authorizations
    where id = 'c1111111-0000-4000-8000-0000000000c1'$$,
  array[1],
  'the revoked authorization stays revoked'
);

select lives_ok(
  $$insert into public.patient_access_authorizations (patient_id, professional_id)
    values (
      '11111111-1111-4111-8111-111111111111',
      '33333333-3333-4333-8333-333333333333'
    )$$,
  'patient A can grant a new authorization after revocation'
);

set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';

select results_eq(
  $$select patient_full_name from public.get_medical_authorized_patients()$$,
  array['Paciente Fictício Alfa'],
  'a new patient grant restores medical A access'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select results_eq(
  $$with revoked as (
      update public.patient_access_authorizations
      set revoked_at = timezone('utc', now())
      where professional_id = '33333333-3333-4333-8333-333333333333'
        and revoked_at is null
      returning 1
    )
    select count(*)::int from revoked$$,
  array[1],
  'patient A can revoke the new authorization'
);

set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';

select is_empty(
  $$select patient_full_name from public.get_medical_authorized_patients()$$,
  'medical A loses access on the request after the second revocation'
);

select is_empty(
  $$select patient_full_name
    from public.get_medical_authorized_patient_latest_records('11111111-1111-4111-8111-111111111111')$$,
  'medical A dashboard stays empty after the second revocation'
);

-- ---------------------------------------------------------------------------
-- Medical B isolation survived patient A revocation
-- ---------------------------------------------------------------------------

set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';

select results_eq(
  $$select patient_full_name from public.get_medical_authorized_patients()$$,
  array['Paciente Fictício Beta'],
  'medical B still sees only patient B'
);

select is_empty(
  $$select patient_full_name
    from public.get_medical_authorized_patient_latest_records('11111111-1111-4111-8111-111111111111')$$,
  'medical B still cannot read patient A'
);

-- ---------------------------------------------------------------------------
-- Anonymous
-- ---------------------------------------------------------------------------

set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $$select id from public.daily_records$$,
  '42501', null, 'anon cannot read daily_records'
);

select throws_ok(
  $$insert into public.daily_records (patient_id, pef_value)
    values ('11111111-1111-4111-8111-111111111111', 300)$$,
  '42501', null, 'anon cannot insert daily_records'
);

select throws_ok(
  $$update public.daily_records set pef_value = 300$$,
  '42501', null, 'anon cannot update daily_records'
);

select throws_ok(
  $$delete from public.daily_records$$,
  '42501', null, 'anon cannot delete daily_records'
);

select throws_ok(
  $$select id from public.patient_access_authorizations$$,
  '42501', null, 'anon cannot read authorizations'
);

select throws_ok(
  $$insert into public.patient_access_authorizations (patient_id, professional_id)
    values (
      '11111111-1111-4111-8111-111111111111',
      '33333333-3333-4333-8333-333333333333'
    )$$,
  '42501', null, 'anon cannot insert authorizations'
);

select throws_ok(
  $$select id from public.profiles$$,
  '42501', null, 'anon cannot read profiles'
);

select throws_ok(
  $$update public.profiles set full_name = 'Nome forjado'$$,
  '42501', null, 'anon cannot update profiles'
);

select throws_ok(
  $$select * from public.get_medical_authorized_patients()$$,
  '42501', null, 'anon cannot execute the medical patient list'
);

select throws_ok(
  $$select * from public.get_medical_authorized_patient_latest_records('11111111-1111-4111-8111-111111111111')$$,
  '42501', null, 'anon cannot execute the medical dashboard RPC'
);

select throws_ok(
  $$select * from public.get_medical_authorized_patient_period_records(
      '11111111-1111-4111-8111-111111111111',
      '-infinity'::timestamptz,
      'infinity'::timestamptz)$$,
  '42501', null, 'anon cannot execute the medical period RPC'
);

select * from finish();

rollback;
