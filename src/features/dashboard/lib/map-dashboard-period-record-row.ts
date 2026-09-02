import { toSymptomSeverity } from "@/features/daily-records/lib/map-daily-record-row";
import type { SymptomSeverity } from "@/types/daily-record";

/**
 * Minimum snake_case projection of `public.daily_records` selected for
 * period-based dashboard metrics and the PEF chart. Excludes `notes` and
 * other identifying/profile columns not required for aggregation.
 *
 * `id` is selected only to give the database query a deterministic secondary
 * sort key when multiple records share the same `recorded_at`; it is never
 * included in the mapped record or exposed to presentational components.
 */
export type DashboardPeriodRecordRow = {
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

export type DashboardPeriodRecord = {
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
 * Maps and defensively validates one period row.
 *
 * Returns null when a required field fails type or range validation, so a
 * single malformed row is excluded from every period metric and the PEF
 * chart rather than silently corrupting aggregated results with a fabricated
 * value. PEF-specific displayability (positive integer) is intentionally not
 * enforced here — it is re-checked only when building chart points, so a
 * record with an unexpectedly invalid PEF can still count toward total
 * records, symptom days, attacks and medication usage.
 */
export function mapDashboardPeriodRecordRow(
  row: DashboardPeriodRecordRow
): DashboardPeriodRecord | null {
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
