import { HISTORY_TIME_ZONE } from "@/features/history/constants";
import { convertDatetimeLocalInTimeZoneToIso } from "@/lib/format-datetime-local";
import type { DailyRecordFormValues } from "@/schemas/daily-record";
import type { SymptomSeverity } from "@/types/daily-record";

/** Matches HTML datetime-local values: YYYY-MM-DDTHH:mm or with seconds. */
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** Writable medical columns shared by insert and update payloads. */
export type DailyRecordWritableColumns = {
  recorded_at: string;
  pef_value: number;
  cough_severity: SymptomSeverity;
  wheezing_severity: SymptomSeverity;
  shortness_of_breath_severity: SymptomSeverity;
  chest_tightness_severity: SymptomSeverity;
  had_attack: boolean;
  used_rescue_medication: boolean;
  notes: string | null;
};

/** Exactly the ten columns `public.daily_records` accepts on insert. */
export type DailyRecordInsertPayload = DailyRecordWritableColumns & {
  patient_id: string;
};

/** Exactly the nine columns a patient may update on their own record. */
export type DailyRecordUpdatePayload = DailyRecordWritableColumns;

/**
 * Converts a `datetime-local` string that has already passed
 * `dailyRecordFormSchema` into an ISO timestamp, preserving the value the
 * user actually saw (their local time and the browser's timezone offset).
 *
 * The string is parsed by explicit components and handed to the local
 * `Date` constructor overload — never to `new Date(string)` — so no `Z`
 * suffix is ever appended and the raw string is never treated as UTC.
 * Returns `null` if conversion cannot produce a valid Date.
 */
export function convertLocalDatetimeToIso(localValue: string): string | null {
  const match = DATETIME_LOCAL_PATTERN.exec(localValue);
  if (!match) {
    return null;
  }

  const year = Number(localValue.slice(0, 4));
  const month = Number(localValue.slice(5, 7));
  const day = Number(localValue.slice(8, 10));
  const hour = Number(localValue.slice(11, 13));
  const minute = Number(localValue.slice(14, 16));
  const second = match[1] ? Number(localValue.slice(17, 19)) : 0;

  const date = new Date(year, month - 1, day, hour, minute, second);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function mapDailyRecordWritableColumns(
  values: DailyRecordFormValues,
  recordedAtIso: string
): DailyRecordWritableColumns {
  return {
    recorded_at: recordedAtIso,
    pef_value: values.pefValue,
    cough_severity: values.coughSeverity,
    wheezing_severity: values.wheezingSeverity,
    shortness_of_breath_severity: values.shortnessOfBreathSeverity,
    chest_tightness_severity: values.chestTightnessSeverity,
    had_attack: values.hadAttack,
    used_rescue_medication: values.usedRescueMedication,
    notes: values.notes,
  };
}

/**
 * Pure mapper from validated form values to the exact snake_case payload
 * `public.daily_records` accepts. Deterministic, makes no Supabase call and
 * reads no global browser state: `patientId` and `recordedAtIso` must come
 * from the verified caller, never from form state.
 */
export function buildDailyRecordInsertPayload(
  values: DailyRecordFormValues,
  recordedAtIso: string,
  patientId: string
): DailyRecordInsertPayload {
  return {
    patient_id: patientId,
    ...mapDailyRecordWritableColumns(values, recordedAtIso),
  };
}

/**
 * Pure mapper from validated edit-form values to the allowed update columns.
 * Does not read authentication state, browser globals, or call Supabase.
 * Ownership columns (`id`, `patient_id`) and timestamps are omitted.
 */
export function buildDailyRecordUpdatePayload(
  values: DailyRecordFormValues,
  recordedAtIso: string
): DailyRecordUpdatePayload {
  return mapDailyRecordWritableColumns(values, recordedAtIso);
}

/**
 * Converts a validated datetime-local value to ISO using the product
 * timezone, so an unchanged edit round-trips the stored instant.
 */
export function convertEditRecordedAtToIso(localValue: string): string | null {
  return convertDatetimeLocalInTimeZoneToIso(localValue, HISTORY_TIME_ZONE);
}
