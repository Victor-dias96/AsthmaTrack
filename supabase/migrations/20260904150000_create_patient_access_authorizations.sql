-- Patient-to-medical-team access authorization relationships.
-- Each row represents one patient granting one medical-team profile
-- (role = 'medical') read-only visibility into that patient's records in a
-- later milestone. RLS is enabled immediately and privileges are revoked
-- from anon and authenticated so the table stays default-deny until
-- ownership/role policies and grants are added in a later migration.
--
-- Lifecycle: an authorization is active while revoked_at is null and
-- revoked once revoked_at is set. Rows are never hard-deleted so the
-- relationship history remains auditable.

create table public.patient_access_authorizations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  professional_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz null,
  constraint patient_access_authorizations_patient_id_fkey
    foreign key (patient_id)
    references public.profiles(id)
    on delete cascade,
  constraint patient_access_authorizations_professional_id_fkey
    foreign key (professional_id)
    references public.profiles(id)
    on delete cascade,
  constraint patient_access_authorizations_distinct_participants
    check (patient_id <> professional_id)
);

comment on table public.patient_access_authorizations is
  'Patient-granted access authorizations for medical-team profiles. Active when revoked_at is null; revoked (but retained for audit) once revoked_at is set. RLS is enabled with a temporary default-deny posture: anon and authenticated have no privileges, and no access policies are defined yet.';

-- One active (revoked_at is null) authorization per patient/professional
-- pair. A revoked row may coexist with a later active reauthorization for
-- the same pair. This also serves as the patient-leading lookup index for
-- "active authorizations granted by one patient" queries.
create unique index idx_patient_access_authorizations_active_patient_professional
  on public.patient_access_authorizations (patient_id, professional_id)
  where revoked_at is null;

-- Professional-leading lookup index for "patients who currently authorize
-- one professional" queries. The unique index above cannot serve this
-- access pattern efficiently because professional_id is not its leading
-- column.
create index idx_patient_access_authorizations_active_professional
  on public.patient_access_authorizations (professional_id, patient_id)
  where revoked_at is null;

alter table public.patient_access_authorizations enable row level security;

revoke all on public.patient_access_authorizations from anon;
revoke all on public.patient_access_authorizations from authenticated;
