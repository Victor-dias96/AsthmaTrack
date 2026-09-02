import { toSymptomSeverity } from "@/features/daily-records/lib/map-daily-record-row";
import type { SymptomSeverity } from "@/types/daily-record";

/**
 * Minimum snake_case projection of `public.daily_records` selected for the
 * report. Excludes notes, patient_id, created_at, updated_at and profile
 * columns. `id` is selected only for deterministic secondary ordering.
 */
export type PatientReportRecordRow = {
  id: string;
  recorded_at: string;
  pef_value: number;
  cough_severity: number;
  wheezing_severity: number;
  shortness_of_breath_severity: number;
  chest_tightness_severity: number;
  had_attack: boolean;
  used_rescue_medication: boolean;
};

export type PatientReportRecord = {
  recordedAt: string;
  pefValue: number;
  coughSeverity: SymptomSeverity;
  wheezingSeverity: SymptomSeverity;
  shortnessOfBreathSeverity: SymptomSeverity;
  chestTightnessSeverity: SymptomSeverity;
  hadAttack: boolean;
  usedRescueMedication: boolean;
};

/**
 * Maps and defensively validates one report row.
 *
 * Follows the Issue 88 period-row policy: returns null when a required
 * field fails type or range validation so a single malformed row is
 * excluded rather than fabricating medical values. Does not coerce invalid
 * PEF to zero, invalid symptoms to 0, or invalid dates to now.
 */
export function mapPatientReportRecordRow(
  row: PatientReportRecordRow
): PatientReportRecord | null {
  const coughSeverity = toSymptomSeverity(row.cough_severity);
  const wheezingSeverity = toSymptomSeverity(row.wheezing_severity);
  const shortnessOfBreathSeverity = toSymptomSeverity(
    row.shortness_of_breath_severity
  );
  const chestTightnessSeverity = toSymptomSeverity(
    row.chest_tightness_severity
  );

  if (
    coughSeverity === null ||
    wheezingSeverity === null ||
    shortnessOfBreathSeverity === null ||
    chestTightnessSeverity === null
  ) {
    return null;
  }

  if (typeof row.pef_value !== "number" || !Number.isFinite(row.pef_value)) {
    return null;
  }

  if (
    typeof row.had_attack !== "boolean" ||
    typeof row.used_rescue_medication !== "boolean"
  ) {
    return null;
  }

  if (typeof row.recorded_at !== "string" || row.recorded_at.length === 0) {
    return null;
  }

  return {
    recordedAt: row.recorded_at,
    pefValue: row.pef_value,
    coughSeverity,
    wheezingSeverity,
    shortnessOfBreathSeverity,
    chestTightnessSeverity,
    hadAttack: row.had_attack,
    usedRescueMedication: row.used_rescue_medication,
  };
}
