import { HISTORY_TIME_ZONE } from "@/features/history/constants";
import { formatIsoToDatetimeLocal } from "@/lib/format-datetime-local";
import type { DailyRecord, SymptomSeverity } from "@/types/daily-record";

/**
 * Typed values passed from the server page into the edit form.
 * Ownership and timestamp metadata are intentionally omitted.
 */
export type DailyRecordEditFormInitialValues = {
  recordedAt: string;
  pefValue: number;
  coughSeverity: SymptomSeverity;
  wheezingSeverity: SymptomSeverity;
  shortnessOfBreathSeverity: SymptomSeverity;
  chestTightnessSeverity: SymptomSeverity;
  hadAttack: boolean;
  usedRescueMedication: boolean;
  notes: string;
};

/**
 * Maps a domain `DailyRecord` into stable edit-form initial values.
 * Converts `recordedAt` in the product timezone and turns null notes
 * into an empty string. Returns null when the timestamp cannot be converted.
 */
export function mapDailyRecordToEditFormValues(
  record: DailyRecord
): DailyRecordEditFormInitialValues | null {
  const recordedAt = formatIsoToDatetimeLocal(
    record.recordedAt,
    HISTORY_TIME_ZONE
  );

  if (recordedAt === null) {
    return null;
  }

  return {
    recordedAt,
    pefValue: record.pefValue,
    coughSeverity: record.coughSeverity,
    wheezingSeverity: record.wheezingSeverity,
    shortnessOfBreathSeverity: record.shortnessOfBreathSeverity,
    chestTightnessSeverity: record.chestTightnessSeverity,
    hadAttack: record.hadAttack,
    usedRescueMedication: record.usedRescueMedication,
    notes: record.notes ?? "",
  };
}
