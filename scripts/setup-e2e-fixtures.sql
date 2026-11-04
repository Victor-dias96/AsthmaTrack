-- Disposable local E2E fixtures for CI.
-- Executed only by scripts/setup-e2e-fixtures.mjs inside the local
-- Supabase database container. No passwords, keys, or hosted URLs live here.
-- The script refuses to change a database that already has other profiles.

begin;

create or replace procedure pg_temp.append_column(
  inout p_cols text[],
  inout p_vals text[],
  p_table text,
  p_column text,
  p_expr text
)
language plpgsql
as $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = p_table
      and column_name = p_column
      and coalesce(is_generated, 'NEVER') <> 'ALWAYS'
  ) then
    p_cols := array_append(p_cols, quote_ident(p_column));
    p_vals := array_append(p_vals, p_expr);
  end if;
end;
$$;

create or replace function pg_temp.crypto_schema()
returns text
language plpgsql
stable
as $$
declare
  v_schema text;
begin
  select n.nspname
    into v_schema
  from pg_extension as extension
  join pg_namespace as n on n.oid = extension.extnamespace
  where extension.extname = 'pgcrypto';

  if v_schema is null then
    raise exception 'E2E_FIXTURE: pgcrypto is not available in the local database.';
  end if;

  return v_schema;
end;
$$;

create or replace procedure pg_temp.ensure_user(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_role text,
  inout p_password text
)
language plpgsql
as $$
declare
  v_schema text := pg_temp.crypto_schema();
  v_password text;
  v_hash text;
  v_existing_id uuid;
  v_existing_email text;
  v_cols text[] := array[]::text[];
  v_vals text[] := array[]::text[];
  v_identity_cols text[] := array[]::text[];
  v_identity_vals text[] := array[]::text[];
  v_token text;
  v_nullable text;
  v_profile_role text;
  v_profile_name text;
  v_onboarding boolean;
  v_code text;
begin
  execute format('select encode(%I.gen_random_bytes(24), %L)', v_schema, 'hex')
    into v_password;

  execute format(
    'select %I.crypt($1, %I.gen_salt(%L))',
    v_schema,
    v_schema,
    'bf'
  )
    into v_hash
    using v_password;

  if v_password is null or length(v_password) < 24 or v_hash is null then
    raise exception 'E2E_FIXTURE: local password generation failed.';
  end if;

  select id
    into v_existing_id
  from auth.users
  where lower(email) = lower(p_email);

  if found and v_existing_id <> p_id then
    raise exception 'E2E_FIXTURE: a fixture email belongs to an unexpected account.';
  end if;

  select email
    into v_existing_email
  from auth.users
  where id = p_id;

  if found and lower(v_existing_email) <> lower(p_email) then
    raise exception 'E2E_FIXTURE: a fixture account id has an unexpected email.';
  end if;

  if found then
    execute format(
      'update auth.users set encrypted_password = %L, updated_at = timezone(''utc'', now()) where id = %L::uuid',
      v_hash,
      p_id::text
    );

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'auth'
        and table_name = 'users'
        and column_name = 'email_confirmed_at'
    ) then
      execute format(
        'update auth.users set email_confirmed_at = timezone(''utc'', now()) where id = %L::uuid',
        p_id::text
      );
    end if;
  else
    call pg_temp.append_column(v_cols, v_vals, 'users', 'instance_id', quote_literal('00000000-0000-0000-0000-000000000000') || '::uuid');
    call pg_temp.append_column(v_cols, v_vals, 'users', 'id', quote_literal(p_id::text) || '::uuid');
    call pg_temp.append_column(v_cols, v_vals, 'users', 'aud', quote_literal('authenticated'));
    call pg_temp.append_column(v_cols, v_vals, 'users', 'role', quote_literal('authenticated'));
    call pg_temp.append_column(v_cols, v_vals, 'users', 'email', quote_literal(p_email));
    call pg_temp.append_column(v_cols, v_vals, 'users', 'encrypted_password', quote_literal(v_hash));
    call pg_temp.append_column(v_cols, v_vals, 'users', 'email_confirmed_at', 'timezone(''utc'', now())');
    call pg_temp.append_column(v_cols, v_vals, 'users', 'raw_app_meta_data', quote_literal('{"provider":"email","providers":["email"]}') || '::jsonb');
    call pg_temp.append_column(
      v_cols,
      v_vals,
      'users',
      'raw_user_meta_data',
      quote_literal(jsonb_build_object('full_name', p_full_name)::text) || '::jsonb'
    );
    call pg_temp.append_column(v_cols, v_vals, 'users', 'created_at', 'timezone(''utc'', now())');
    call pg_temp.append_column(v_cols, v_vals, 'users', 'updated_at', 'timezone(''utc'', now())');
    call pg_temp.append_column(v_cols, v_vals, 'users', 'is_super_admin', 'false');
    call pg_temp.append_column(v_cols, v_vals, 'users', 'is_sso_user', 'false');
    call pg_temp.append_column(v_cols, v_vals, 'users', 'is_anonymous', 'false');

    foreach v_token in array array[
      'confirmation_token',
      'recovery_token',
      'email_change',
      'email_change_token_new',
      'email_change_token_current',
      'reauthentication_token',
      'phone_change',
      'phone_change_token'
    ]
    loop
      select is_nullable
        into v_nullable
      from information_schema.columns
      where table_schema = 'auth'
        and table_name = 'users'
        and column_name = v_token
        and coalesce(is_generated, 'NEVER') <> 'ALWAYS';

      if found then
        if v_nullable = 'YES' then
          call pg_temp.append_column(v_cols, v_vals, 'users', v_token, 'null');
        else
          call pg_temp.append_column(v_cols, v_vals, 'users', v_token, quote_literal(''));
        end if;
      end if;
    end loop;

    execute format(
      'insert into auth.users (%s) values (%s)',
      array_to_string(v_cols, ', '),
      array_to_string(v_vals, ', ')
    );
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = p_id
      and provider = 'email'
  ) then
    call pg_temp.append_column(v_identity_cols, v_identity_vals, 'identities', 'id', 'gen_random_uuid()');
    call pg_temp.append_column(v_identity_cols, v_identity_vals, 'identities', 'user_id', quote_literal(p_id::text) || '::uuid');
    call pg_temp.append_column(v_identity_cols, v_identity_vals, 'identities', 'provider', quote_literal('email'));
    call pg_temp.append_column(v_identity_cols, v_identity_vals, 'identities', 'provider_id', quote_literal(p_id::text));
    call pg_temp.append_column(
      v_identity_cols,
      v_identity_vals,
      'identities',
      'identity_data',
      quote_literal(
        jsonb_build_object(
          'sub', p_id::text,
          'email', p_email,
          'email_verified', true
        )::text
      ) || '::jsonb'
    );
    call pg_temp.append_column(v_identity_cols, v_identity_vals, 'identities', 'last_sign_in_at', 'timezone(''utc'', now())');
    call pg_temp.append_column(v_identity_cols, v_identity_vals, 'identities', 'created_at', 'timezone(''utc'', now())');
    call pg_temp.append_column(v_identity_cols, v_identity_vals, 'identities', 'updated_at', 'timezone(''utc'', now())');

    execute format(
      'insert into auth.identities (%s) values (%s)',
      array_to_string(v_identity_cols, ', '),
      array_to_string(v_identity_vals, ', ')
    );
  end if;

  update public.profiles
  set
    full_name = p_full_name,
    role = p_role::public.user_role,
    onboarding_completed = true
  where id = p_id;

  if not found then
    insert into public.profiles (id, full_name, role, onboarding_completed)
    values (p_id, p_full_name, p_role::public.user_role, true);
  end if;

  select
    profiles.role::text,
    profiles.full_name,
    profiles.onboarding_completed,
    profiles.professional_code
    into v_profile_role, v_profile_name, v_onboarding, v_code
  from public.profiles
  where profiles.id = p_id;

  if v_profile_role is distinct from p_role
    or v_profile_name is distinct from p_full_name
    or v_onboarding is distinct from true
  then
    raise exception 'E2E_FIXTURE: profile contract was not met.';
  end if;

  if p_role = 'patient' and v_code is not null then
    raise exception 'E2E_FIXTURE: a patient profile received a professional code.';
  end if;

  if p_role = 'medical' and v_code !~ '^[A-Z2-9]{8}$' then
    raise exception 'E2E_FIXTURE: medical professional code was not assigned.';
  end if;

  p_password := v_password;
end;
$$;

create or replace function pg_temp.ensure_record(
  p_record_id uuid,
  p_patient_id uuid,
  p_pef integer
)
returns void
language plpgsql
as $$
declare
  v_patient_id uuid;
  v_pef integer;
begin
  select patient_id, pef_value
    into v_patient_id, v_pef
  from public.daily_records
  where id = p_record_id;

  if found then
    if v_patient_id <> p_patient_id or v_pef <> p_pef then
      raise exception 'E2E_FIXTURE: an existing fixture record does not match the contract.';
    end if;

    update public.daily_records
    set recorded_at = timezone('utc', now())
    where id = p_record_id;
    return;
  end if;

  if exists (
    select 1
    from public.daily_records
    where patient_id = p_patient_id
  ) then
    raise exception 'E2E_FIXTURE: fixture patient already has an unexpected record.';
  end if;

  insert into public.daily_records (
    id,
    patient_id,
    recorded_at,
    pef_value,
    cough_severity,
    wheezing_severity,
    shortness_of_breath_severity,
    chest_tightness_severity,
    had_attack,
    used_rescue_medication,
    notes
  ) values (
    p_record_id,
    p_patient_id,
    timezone('utc', now()),
    p_pef,
    0,
    0,
    0,
    0,
    false,
    false,
    null
  );
end;
$$;

create or replace function pg_temp.ensure_authorization(
  p_patient_id uuid,
  p_professional_id uuid
)
returns void
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.patient_access_authorizations
    where patient_id = p_patient_id
      and professional_id = p_professional_id
      and revoked_at is null
  ) then
    return;
  end if;

  insert into public.patient_access_authorizations (patient_id, professional_id)
  values (p_patient_id, p_professional_id);
end;
$$;

create or replace procedure pg_temp.setup_e2e_fixtures()
language plpgsql
as $$
declare
  c_patient_a uuid := 'e2ea0001-0000-4000-8000-0000000000a1';
  c_patient_b uuid := 'e2eb0002-0000-4000-8000-0000000000b2';
  c_medical_a uuid := 'e2ec0003-0000-4000-8000-0000000000c3';
  c_medical_b uuid := 'e2ed0004-0000-4000-8000-0000000000d4';
  c_record_a uuid := 'e2ea0011-0000-4000-8000-0000000000aa';
  c_record_b uuid := 'e2eb0012-0000-4000-8000-0000000000bb';
  c_patient_a_email text := 'patient-a@fixtures.asthmatrack.test';
  c_patient_b_email text := 'patient-b@fixtures.asthmatrack.test';
  c_medical_a_email text := 'medical-a@fixtures.asthmatrack.test';
  c_medical_b_email text := 'medical-b@fixtures.asthmatrack.test';
  c_patient_a_name text := 'pacienteA';
  c_patient_b_name text := 'pacienteB';
  c_medical_a_name text := 'Profissional Ficticio Alfa';
  c_medical_b_name text := 'Profissional Ficticio Beta';
  c_patient_a_pef integer := 418;
  c_patient_b_pef integer := 527;
  v_fixture_users integer;
  v_password_patient_a text;
  v_password_patient_b text;
  v_password_medical_a text;
  v_password_medical_b text;
  v_code_a text;
  v_code_b text;
  v_active integer;
begin
  if exists (
    select 1
    from public.profiles
    where id not in (c_patient_a, c_patient_b, c_medical_a, c_medical_b)
  ) then
    raise exception 'E2E_FIXTURE: refusing to modify a database that already has other profiles.';
  end if;

  select count(*)
    into v_fixture_users
  from auth.users
  where id in (c_patient_a, c_patient_b, c_medical_a, c_medical_b);

  if v_fixture_users not in (0, 4) then
    raise exception 'E2E_FIXTURE: fixture accounts are only partially present.';
  end if;

  call pg_temp.ensure_user(
    c_patient_a,
    c_patient_a_email,
    c_patient_a_name,
    'patient',
    v_password_patient_a
  );
  call pg_temp.ensure_user(
    c_patient_b,
    c_patient_b_email,
    c_patient_b_name,
    'patient',
    v_password_patient_b
  );
  call pg_temp.ensure_user(
    c_medical_a,
    c_medical_a_email,
    c_medical_a_name,
    'medical',
    v_password_medical_a
  );
  call pg_temp.ensure_user(
    c_medical_b,
    c_medical_b_email,
    c_medical_b_name,
    'medical',
    v_password_medical_b
  );

  perform pg_temp.ensure_record(c_record_a, c_patient_a, c_patient_a_pef);
  perform pg_temp.ensure_record(c_record_b, c_patient_b, c_patient_b_pef);
  perform pg_temp.ensure_authorization(c_patient_a, c_medical_a);
  perform pg_temp.ensure_authorization(c_patient_b, c_medical_b);

  select professional_code
    into v_code_a
  from public.profiles
  where id = c_medical_a;

  select professional_code
    into v_code_b
  from public.profiles
  where id = c_medical_b;

  if v_code_a is null or v_code_b is null or v_code_a = v_code_b then
    raise exception 'E2E_FIXTURE: medical professional codes are missing or not distinct.';
  end if;

  select count(*)
    into v_active
  from public.patient_access_authorizations
  where revoked_at is null;

  if v_active <> 2 then
    raise exception 'E2E_FIXTURE: expected exactly two active authorizations.';
  end if;

  if exists (
    select 1
    from public.patient_access_authorizations
    where revoked_at is null
      and (patient_id, professional_id) not in (
        (c_patient_a, c_medical_a),
        (c_patient_b, c_medical_b)
      )
  ) then
    raise exception 'E2E_FIXTURE: a cross-authorization is present.';
  end if;

  create temp table if not exists e2e_fixture_payload (
    payload jsonb
  ) on commit preserve rows;

  delete from e2e_fixture_payload;

  insert into e2e_fixture_payload (payload)
  values (jsonb_build_object(
    'patient_a_email', c_patient_a_email,
    'patient_a_password', v_password_patient_a,
    'patient_a_id', c_patient_a::text,
    'patient_a_record_id', c_record_a::text,
    'patient_a_pef', c_patient_a_pef,
    'patient_b_email', c_patient_b_email,
    'patient_b_password', v_password_patient_b,
    'patient_b_id', c_patient_b::text,
    'patient_b_record_id', c_record_b::text,
    'patient_b_pef', c_patient_b_pef,
    'medical_a_email', c_medical_a_email,
    'medical_a_password', v_password_medical_a,
    'medical_a_code', v_code_a,
    'medical_b_email', c_medical_b_email,
    'medical_b_password', v_password_medical_b,
    'medical_b_code', v_code_b
  ));
end;
$$;

call pg_temp.setup_e2e_fixtures();

select payload::text from e2e_fixture_payload;

commit;
