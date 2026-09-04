-- Row Level Security policies and grants for public.patient_access_authorizations.
--
-- Issue 101 created the table with RLS enabled and no functional policies
-- (default-deny: anon and authenticated had zero privileges). This migration
-- adds the minimum policies and grants needed for the patient-managed
-- authorization lifecycle:
--   - a patient may view, create and revoke authorizations they own;
--   - a medical-team professional may view only the active authorizations
--     directed to their own identity;
--   - anon keeps zero privileges.
--
-- This migration intentionally does NOT grant any medical-team access to
-- public.daily_records or any other patient health data. That remains out of
-- scope until the corresponding read-only access issues are implemented.

-- ---------------------------------------------------------------------------
-- Private helper schema
-- ---------------------------------------------------------------------------
-- public.profiles' own "Users can view own profile" policy restricts SELECT
-- to `id = auth.uid()`. A plain correlated subquery run as the calling role
-- can therefore never confirm the role of an *arbitrary* profile_id (e.g. the
-- professional being authorized) -- it would simply see zero rows for any
-- other user's profile and the check would always fail. A SECURITY DEFINER
-- function is required to perform that boolean role lookup safely.
--
-- That function must not be reachable as a Data API RPC call (it must stay
-- an internal policy helper only), so it is created in a `private` schema
-- that is not listed in supabase/config.toml's `api.schemas`, following the
-- standard Supabase pattern for RLS-only helper functions.
create schema private;

comment on schema private is
  'Helper functions used only by RLS policies. Not exposed via the Data API (see supabase/config.toml api.schemas).';

revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Role-check helper (private, SECURITY DEFINER, boolean-only)
-- ---------------------------------------------------------------------------
-- Used to confirm the caller is a persisted patient and to confirm an
-- arbitrary target profile is a persisted medical-team profile. Returns only
-- a boolean -- never profile data, email, name or role text -- so it cannot
-- become a profile directory. It reads public.profiles only (no daily_records,
-- no patient_access_authorizations), performs no writes and accepts no
-- dynamic SQL, avoiding any risk of RLS recursion back into this table.
create or replace function private.profile_has_role(profile_id uuid, expected_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = profile_id
      and profiles.role = expected_role
  );
$$;

comment on function private.profile_has_role(uuid, public.user_role) is
  'Boolean-only role check for patient_access_authorizations policies. Returns no profile data.';

revoke all on function private.profile_has_role(uuid, public.user_role) from public;
revoke all on function private.profile_has_role(uuid, public.user_role) from anon;
grant execute on function private.profile_has_role(uuid, public.user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Revocation lifecycle trigger
-- ---------------------------------------------------------------------------
-- RLS USING/WITH CHECK expressions cannot compare a row's OLD and NEW values,
-- so they cannot by themselves guarantee that revoked_at only ever moves from
-- null to a database-generated timestamp. This trigger enforces that
-- direction and discards any revoked_at value supplied by the client,
-- mirroring the existing public.protect_profile_fields() convention of
-- silently ignoring untrusted client-provided values for the `authenticated`
-- role while leaving trusted database operations (postgres, service_role)
-- unaffected.
create or replace function public.enforce_patient_access_authorization_revocation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    if old.revoked_at is not null then
      -- Revocation is one-way: an already revoked row cannot be changed
      -- further (not re-revoked, and never reactivated).
      new.revoked_at := old.revoked_at;
    elsif new.revoked_at is not null then
      -- Ignore any client-supplied timestamp; the database always records
      -- the actual revocation time.
      new.revoked_at := timezone('utc', now());
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_patient_access_authorization_revocation_trigger
before update on public.patient_access_authorizations
for each row
execute function public.enforce_patient_access_authorization_revocation();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- anon keeps zero privileges. authenticated gets exactly what its policies
-- below can restrict:
--   - full-row SELECT (row visibility is governed by the SELECT policies);
--   - INSERT of only the identity columns a patient may set;
--   - UPDATE of only revoked_at, so id/patient_id/professional_id/created_at
--     can never be targeted by a client UPDATE statement regardless of
--     policy evaluation.
-- No DELETE is granted anywhere: authorization history is never hard-deleted
-- through the application, only marked revoked via revoked_at.
revoke all on public.patient_access_authorizations from anon;
revoke all on public.patient_access_authorizations from authenticated;

grant select on public.patient_access_authorizations to authenticated;
grant insert (patient_id, professional_id) on public.patient_access_authorizations to authenticated;
grant update (revoked_at) on public.patient_access_authorizations to authenticated;

-- ---------------------------------------------------------------------------
-- SELECT policies
-- ---------------------------------------------------------------------------

-- Patients can view every authorization row they created, active or
-- revoked, so they can audit their own authorization history (needed by
-- Issue 104's active list and future revocation-history views). Ownership is
-- tied directly to the authenticated UUID; no client-supplied identifier,
-- email or name is ever used.
create policy "Patients can view own access authorizations"
on public.patient_access_authorizations
for select
to authenticated
using (patient_id = (select auth.uid()));

-- Professionals can view only the authorizations currently active and
-- directed to their own identity. Revoked rows and rows directed to other
-- professionals are never visible here, and this policy never grants a
-- patient professional-list behavior. The role check is re-evaluated on
-- every query (not cached at authorization time), so a professional who
-- later loses the medical role immediately loses this visibility, even
-- though the historical row remains stored and the owning patient can still
-- see and revoke it.
create policy "Professionals can view active access authorizations"
on public.patient_access_authorizations
for select
to authenticated
using (
  professional_id = (select auth.uid())
  and revoked_at is null
  and private.profile_has_role((select auth.uid()), 'medical'::public.user_role)
);

-- ---------------------------------------------------------------------------
-- INSERT policy
-- ---------------------------------------------------------------------------

-- A patient may create an authorization only for themselves, targeting a
-- distinct, persisted medical-team profile, starting in the active state.
-- The Issue 101 partial unique index (one active authorization per
-- patient/professional pair) already guards against duplicates and is not
-- duplicated here.
create policy "Patients can insert own access authorizations"
on public.patient_access_authorizations
for insert
to authenticated
with check (
  patient_id = (select auth.uid())
  and patient_id <> professional_id
  and revoked_at is null
  and private.profile_has_role((select auth.uid()), 'patient'::public.user_role)
  and private.profile_has_role(professional_id, 'medical'::public.user_role)
);

-- ---------------------------------------------------------------------------
-- UPDATE (revocation) policy
-- ---------------------------------------------------------------------------

-- Only the owning patient may update their own authorization, and only to
-- revoke it. USING restricts eligible rows to the patient's own currently
-- active rows; WITH CHECK requires the resulting row to be revoked.
-- Combined with the update(revoked_at) column grant above and the
-- revocation trigger, a patient can only ever move their own row from
-- active to revoked, once, with a database-generated timestamp -- never
-- transfer it, never change the authorized professional, never touch
-- created_at, and never reactivate a revoked row. No professional-facing
-- UPDATE policy exists, so professionals can never revoke, reactivate or
-- otherwise modify any authorization row.
create policy "Patients can revoke own access authorizations"
on public.patient_access_authorizations
for update
to authenticated
using (
  patient_id = (select auth.uid())
  and revoked_at is null
)
with check (
  patient_id = (select auth.uid())
  and revoked_at is not null
);

-- ---------------------------------------------------------------------------
-- No DELETE policy
-- ---------------------------------------------------------------------------
-- Intentionally no DELETE policy and no DELETE grant: authorization history
-- is never hard-deleted through the application. Revocation is expressed
-- exclusively through revoked_at.

comment on table public.patient_access_authorizations is
  'Patient-granted access authorizations for medical-team profiles. Active when revoked_at is null; revoked (but retained for audit) once revoked_at is set. Patients may view, create and revoke their own rows; medical-team professionals may view only their own active rows. This migration does not grant medical-team access to patient health data (e.g. public.daily_records).';
