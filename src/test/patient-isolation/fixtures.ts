/**
 * Fictional Patient A / Patient B identities and records for the Issue 130
 * isolation suites. No value here belongs to a real person or a real
 * Supabase project: the UUIDs are hand-written, the names are invented and
 * every PEF value and note is chosen only to keep the two patients visibly
 * distinct in assertions.
 */

export const PATIENT_A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const PATIENT_B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

export const PATIENT_A_NAME = "Paciente Fictício Alfa";
export const PATIENT_B_NAME = "Paciente Fictício Beta";

export const PATIENT_A_RECORD_1_ID = "a1a1a1a1-0000-4000-8000-0000000000a1";
export const PATIENT_A_RECORD_2_ID = "a2a2a2a2-0000-4000-8000-0000000000a2";
export const PATIENT_B_RECORD_1_ID = "b1b1b1b1-0000-4000-8000-0000000000b1";
export const PATIENT_B_RECORD_2_ID = "b2b2b2b2-0000-4000-8000-0000000000b2";

/** A well-formed UUID that never exists in any fixture table. */
export const NONEXISTENT_RECORD_ID = "c0c0c0c0-0000-4000-8000-0000000000c0";

export const PATIENT_A_PEF_VALUES = [410, 430] as const;
export const PATIENT_B_PEF_VALUES = [260, 275] as const;

export const PATIENT_A_NOTES = ["Nota fictícia Alfa um", "Nota fictícia Alfa dois"];
export const PATIENT_B_NOTES = ["Nota fictícia Beta um", "Nota fictícia Beta dois"];

export type DailyRecordFixtureRow = {
  id: string;
  patient_id: string;
  recorded_at: string;
  pef_value: number;
  cough_severity: number;
  wheezing_severity: number;
  shortness_of_breath_severity: number;
  chest_tightness_severity: number;
  had_attack: boolean;
  used_rescue_medication: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileFixtureRow = {
  id: string;
  full_name: string;
  role: "patient";
};

const HOUR_MS = 60 * 60 * 1000;

function hoursBefore(now: Date, hours: number): string {
  return new Date(now.getTime() - hours * HOUR_MS).toISOString();
}

/**
 * Builds the four fixture records relative to `now` so every record falls
 * inside the 7-day dashboard, history and report windows.
 *
 * Patient B's newest record is deliberately more recent than any of Patient
 * A's, so a query missing its owner filter would surface Patient B as
 * "latest" instead of silently passing.
 *
 * Known per-patient totals:
 * - Patient A: 2 records, 1 attack, 1 rescue-medication use, 1 symptom day.
 * - Patient B: 2 records, 2 attacks, 2 rescue-medication uses, 2 symptom days.
 */
export function buildDailyRecordFixtures(now: Date): DailyRecordFixtureRow[] {
  const row = (
    values: Omit<DailyRecordFixtureRow, "created_at" | "updated_at">
  ): DailyRecordFixtureRow => ({
    ...values,
    created_at: values.recorded_at,
    updated_at: values.recorded_at,
  });

  return [
    row({
      id: PATIENT_B_RECORD_1_ID,
      patient_id: PATIENT_B_ID,
      recorded_at: hoursBefore(now, 2),
      pef_value: PATIENT_B_PEF_VALUES[0],
      cough_severity: 0,
      wheezing_severity: 2,
      shortness_of_breath_severity: 0,
      chest_tightness_severity: 0,
      had_attack: true,
      used_rescue_medication: true,
      notes: PATIENT_B_NOTES[0],
    }),
    row({
      id: PATIENT_A_RECORD_1_ID,
      patient_id: PATIENT_A_ID,
      recorded_at: hoursBefore(now, 26),
      pef_value: PATIENT_A_PEF_VALUES[0],
      cough_severity: 1,
      wheezing_severity: 0,
      shortness_of_breath_severity: 0,
      chest_tightness_severity: 0,
      had_attack: true,
      used_rescue_medication: true,
      notes: PATIENT_A_NOTES[0],
    }),
    row({
      id: PATIENT_B_RECORD_2_ID,
      patient_id: PATIENT_B_ID,
      recorded_at: hoursBefore(now, 50),
      pef_value: PATIENT_B_PEF_VALUES[1],
      cough_severity: 0,
      wheezing_severity: 0,
      shortness_of_breath_severity: 1,
      chest_tightness_severity: 0,
      had_attack: true,
      used_rescue_medication: true,
      notes: PATIENT_B_NOTES[1],
    }),
    row({
      id: PATIENT_A_RECORD_2_ID,
      patient_id: PATIENT_A_ID,
      recorded_at: hoursBefore(now, 74),
      pef_value: PATIENT_A_PEF_VALUES[1],
      cough_severity: 0,
      wheezing_severity: 0,
      shortness_of_breath_severity: 0,
      chest_tightness_severity: 0,
      had_attack: false,
      used_rescue_medication: false,
      notes: PATIENT_A_NOTES[1],
    }),
  ];
}

export function buildProfileFixtures(): ProfileFixtureRow[] {
  return [
    { id: PATIENT_A_ID, full_name: PATIENT_A_NAME, role: "patient" },
    { id: PATIENT_B_ID, full_name: PATIENT_B_NAME, role: "patient" },
  ];
}
