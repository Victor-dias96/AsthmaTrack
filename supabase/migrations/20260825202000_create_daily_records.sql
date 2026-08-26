-- Daily asthma records: PEF and symptom measurements for a patient profile.
-- RLS is enabled immediately and privileges are revoked from anon and
-- authenticated so the table stays default-deny until ownership policies
-- and grants are added in a later migration.

create table public.daily_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  recorded_at timestamptz not null default timezone('utc', now()),
  pef_value integer not null,
  cough_severity smallint not null default 0,
  wheezing_severity smallint not null default 0,
  shortness_of_breath_severity smallint not null default 0,
  chest_tightness_severity smallint not null default 0,
  had_attack boolean not null default false,
  used_rescue_medication boolean not null default false,
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint daily_records_patient_id_fkey
    foreign key (patient_id)
    references public.profiles(id)
    on delete cascade,
  constraint daily_records_pef_value_positive
    check (pef_value > 0),
  constraint daily_records_cough_severity_range
    check (cough_severity between 0 and 3),
  constraint daily_records_wheezing_severity_range
    check (wheezing_severity between 0 and 3),
  constraint daily_records_shortness_of_breath_severity_range
    check (shortness_of_breath_severity between 0 and 3),
  constraint daily_records_chest_tightness_severity_range
    check (chest_tightness_severity between 0 and 3),
  constraint daily_records_notes_valid
    check (
      notes is null
      or (
        length(notes) <= 1000
        and length(trim(notes)) > 0
      )
    )
);

comment on table public.daily_records is
  'Patient daily asthma records (PEF and symptom severity). RLS is enabled with a temporary default-deny posture: anon and authenticated have no privileges, and no access policies are defined yet.';

create index idx_daily_records_patient_id
  on public.daily_records (patient_id);

create index idx_daily_records_patient_id_recorded_at_desc
  on public.daily_records (patient_id, recorded_at desc);

create trigger update_daily_records_updated_at
before update on public.daily_records
for each row
execute function public.update_updated_at_column();

alter table public.daily_records enable row level security;

revoke all on public.daily_records from anon;
revoke all on public.daily_records from authenticated;
