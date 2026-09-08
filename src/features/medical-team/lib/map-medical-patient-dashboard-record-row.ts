import { toSymptomSeverity } from "@/features/daily-records/lib/map-daily-record-row";

import { normalizePatientName } from "./normalize-patient-name";
import type { MedicalPatientDashboardRecord } from "../types/medical-patient-dashboard";

/** Fixed limit mirroring RECENT_RECORDS_DISPLAY_LIMIT (src/features/dashboard/constants.ts). */
export const MEDICAL_DASHBOARD_RECENT_RECORDS_LIMIT = 3;

type NullableRecordFields = {
  recorded_at: string | null;
  pef_value: number | null;
  cough_severity: number | null;
  wheezing_severity: number | null;
  shortness_of_breath_severity: number | null;
  chest_tightness_severity: number | null;
  had_attack: boolean | null;
  used_rescue_medication: boolean | null;
};

type RawLatestRecordRow = NullableRecordFields & {
  patient_full_name: string | null;
};

type NullishRead<T> = T | null | "invalid";

/**
 * PostgREST table-valued RPCs return an array. A single-row result is
 * still normalized here so a one-row empty sentinel cannot be classified
 * as unavailable merely because the payload was an object.
 */
export function normalizeMedicalDashboardRpcRows(
  data: unknown
): unknown[] | null {
  if (Array.isArray(data)) {
    return data;
  }

  if (data !== null && typeof data === "object") {
    return [data];
  }

  return null;
}

function readNullishString(value: unknown): NullishRead<string> {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return "invalid";
}

function readNullishNumber(value: unknown): NullishRead<number> {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return "invalid";
}

function readNullishBoolean(value: unknown): NullishRead<boolean> {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return "invalid";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isNullableBoolean(value: unknown): value is boolean | null {
  return value === null || typeof value === "boolean";
}

function hasNullableRecordFieldsShape(
  value: Record<string, unknown>
): value is Record<string, unknown> & NullableRecordFields {
  return (
    isNullableString(value.recorded_at) &&
    isNullableNumber(value.pef_value) &&
    isNullableNumber(value.cough_severity) &&
    isNullableNumber(value.wheezing_severity) &&
    isNullableNumber(value.shortness_of_breath_severity) &&
    isNullableNumber(value.chest_tightness_severity) &&
    isNullableBoolean(value.had_attack) &&
    isNullableBoolean(value.used_rescue_medication)
  );
}

/**
 * Latest-record columns may be JSON-null or omitted. The authorized
 * zero-record sentinel is one row whose record-bearing fields are all
 * absent/null while the patient display name is still present. Missing
 * keys must not be treated as a mapping failure -- that would turn a
 * successful empty dashboard into unavailable. Wrong JSON types remain
 * invalid.
 */
function parseRawLatestRecordRow(value: unknown): RawLatestRecordRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const patientFullName = readNullishString(record.patient_full_name);
  const recordedAt = readNullishString(record.recorded_at);
  const pefValue = readNullishNumber(record.pef_value);
  const coughSeverity = readNullishNumber(record.cough_severity);
  const wheezingSeverity = readNullishNumber(record.wheezing_severity);
  const shortnessOfBreathSeverity = readNullishNumber(
    record.shortness_of_breath_severity
  );
  const chestTightnessSeverity = readNullishNumber(
    record.chest_tightness_severity
  );
  const hadAttack = readNullishBoolean(record.had_attack);
  const usedRescueMedication = readNullishBoolean(
    record.used_rescue_medication
  );

  if (
    patientFullName === "invalid" ||
    recordedAt === "invalid" ||
    pefValue === "invalid" ||
    coughSeverity === "invalid" ||
    wheezingSeverity === "invalid" ||
    shortnessOfBreathSeverity === "invalid" ||
    chestTightnessSeverity === "invalid" ||
    hadAttack === "invalid" ||
    usedRescueMedication === "invalid"
  ) {
    return null;
  }

  return {
    patient_full_name: patientFullName,
    recorded_at: recordedAt,
    pef_value: pefValue,
    cough_severity: coughSeverity,
    wheezing_severity: wheezingSeverity,
    shortness_of_breath_severity: shortnessOfBreathSeverity,
    chest_tightness_severity: chestTightnessSeverity,
    had_attack: hadAttack,
    used_rescue_medication: usedRescueMedication,
  };
}

function isPeriodRecordRowShape(
  value: unknown
): value is NullableRecordFields {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return hasNullableRecordFieldsShape(value as Record<string, unknown>);
}

/** True only when every record-bearing column is null (the "zero records" sentinel row). */
function isEmptyRecordSentinel(row: NullableRecordFields): boolean {
  return (
    row.recorded_at === null &&
    row.pef_value === null &&
    row.cough_severity === null &&
    row.wheezing_severity === null &&
    row.shortness_of_breath_severity === null &&
    row.chest_tightness_severity === null &&
    row.had_attack === null &&
    row.used_rescue_medication === null
  );
}

/**
 * Maps one fully-populated record row. Returns null when any single field
 * is missing or fails type/range validation -- a half-populated row (some
 * fields present, others null) is malformed data, never a valid record and
 * never the "zero records" sentinel. Mirrors the field-level validation in
 * src/features/dashboard/lib/map-dashboard-period-record-row.ts exactly, so
 * the medical and patient dashboards apply the same defensive rules.
 */
function mapPopulatedRecordRow(
  row: NullableRecordFields
): MedicalPatientDashboardRecord | null {
  const {
    recorded_at,
    pef_value,
    cough_severity,
    wheezing_severity,
    shortness_of_breath_severity,
    chest_tightness_severity,
    had_attack,
    used_rescue_medication,
  } = row;

  if (
    recorded_at === null ||
    pef_value === null ||
    cough_severity === null ||
    wheezing_severity === null ||
    shortness_of_breath_severity === null ||
    chest_tightness_severity === null ||
    had_attack === null ||
    used_rescue_medication === null
  ) {
    return null;
  }

  if (recorded_at.length === 0 || !Number.isFinite(pef_value)) {
    return null;
  }

  const coughSeverity = toSymptomSeverity(cough_severity);
  const wheezingSeverity = toSymptomSeverity(wheezing_severity);
  const shortnessOfBreathSeverity = toSymptomSeverity(
    shortness_of_breath_severity
  );
  const chestTightnessSeverity = toSymptomSeverity(chest_tightness_severity);

  if (
    coughSeverity === null ||
    wheezingSeverity === null ||
    shortnessOfBreathSeverity === null ||
    chestTightnessSeverity === null
  ) {
    return null;
  }

  return {
    recordedAt: recorded_at,
    pefValue: pef_value,
    coughSeverity,
    wheezingSeverity,
    shortnessOfBreathSeverity,
    chestTightnessSeverity,
    hadAttack: had_attack,
    usedRescueMedication: used_rescue_medication,
  };
}

export type ParsedLatestRecordsResult =
  | {
      status: "ok";
      patientName: string;
      records: readonly MedicalPatientDashboardRecord[];
    }
  | { status: "error" };

/**
 * Validates and maps every row returned by
 * `public.get_medical_authorized_patient_latest_records`. The project has
 * no generated Database types, so the RPC response is treated as `unknown`
 * and checked at runtime rather than trusted via an unsafe type assertion
 * (mirrors src/features/medical-team/lib/map-medical-authorized-patient-row.ts).
 *
 * Expects 1-3 rows, each sharing the same `patient_full_name` (defensive
 * integrity check -- every row comes from the same authorized patient).
 * Exactly one row with every record field null or omitted means the
 * patient has zero records. Any other malformed shape (wrong row count
 * already rejected by the caller, inconsistent patient name, a
 * half-populated record) returns `"error"` so the caller renders the
 * safe unavailable state instead of a fabricated or partial dashboard.
 */
export function parseMedicalPatientLatestRecordsRows(
  data: readonly unknown[]
): ParsedLatestRecordsResult {
  const rows: RawLatestRecordRow[] = [];

  for (const item of data) {
    const parsed = parseRawLatestRecordRow(item);

    if (parsed === null) {
      return { status: "error" };
    }

    rows.push(parsed);
  }

  const [firstRow] = rows;

  if (!firstRow) {
    return { status: "error" };
  }

  if (rows.some((row) => row.patient_full_name !== firstRow.patient_full_name)) {
    return { status: "error" };
  }

  const patientName = normalizePatientName(firstRow.patient_full_name);

  if (rows.length === 1 && isEmptyRecordSentinel(rows[0])) {
    return { status: "ok", patientName, records: [] };
  }

  const records: MedicalPatientDashboardRecord[] = [];

  for (const row of rows) {
    const mapped = mapPopulatedRecordRow(row);

    if (mapped === null) {
      return { status: "error" };
    }

    records.push(mapped);
  }

  return { status: "ok", patientName, records };
}

/**
 * Validates and maps every row returned by
 * `public.get_medical_authorized_patient_period_records`. Returns null
 * (never a partially-mapped array) when the response is not an array or
 * contains a malformed row, so the caller never renders partial period
 * metrics or an incomplete chart.
 */
export function parseMedicalPatientPeriodRecordsRows(
  data: unknown
): readonly MedicalPatientDashboardRecord[] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const records: MedicalPatientDashboardRecord[] = [];

  for (const item of data) {
    if (!isPeriodRecordRowShape(item)) {
      return null;
    }

    const mapped = mapPopulatedRecordRow(item);

    if (mapped === null) {
      return null;
    }

    records.push(mapped);
  }

  return records;
}
