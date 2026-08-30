import type { DailyRecord, SymptomSeverity } from "@/types/daily-record";

/**
 * Minimum snake_case representation of the `public.daily_records` columns
 * selected by the patient history query. Not a full generated schema.
 */
export type DailyRecordRow = {
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

function toSymptomSeverity(value: number): SymptomSeverity | null {
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value;
  }

  return null;
}

/**
 * Maps a selected `daily_records` row to the application `DailyRecord` type.
 * Returns null when a severity value is outside the 0–3 union.
 */
export function mapDailyRecordRow(row: DailyRecordRow): DailyRecord | null {
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

  return {
    id: row.id,
    patientId: row.patient_id,
    recordedAt: row.recorded_at,
    pefValue: row.pef_value,
    coughSeverity,
    wheezingSeverity,
    shortnessOfBreathSeverity,
    chestTightnessSeverity,
    hadAttack: row.had_attack,
    usedRescueMedication: row.used_rescue_medication,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
