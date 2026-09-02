import type { SymptomSeverity } from "@/types/daily-record";

import type { PatientReportRecord } from "./map-patient-report-record-row";

export const REPORT_SYMPTOM_FREQUENCY_IDS = [
  "cough",
  "wheezing",
  "shortnessOfBreath",
  "chestTightness",
] as const;

export type SymptomFrequencyId =
  (typeof REPORT_SYMPTOM_FREQUENCY_IDS)[number];

export type SymptomFrequencyItem = {
  symptom: SymptomFrequencyId;
  count: number;
  totalRecords: number;
  percentage: number;
};

export type SymptomFrequencySummary = {
  totalRecords: number;
  items: readonly SymptomFrequencyItem[];
};

/**
 * True when a mapped severity is exactly 0, 1, 2 or 3. Defensive
 * read-boundary check; does not coerce, clamp or replace invalid values.
 */
function isValidReportSymptomSeverity(
  value: number
): value is SymptomSeverity {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/**
 * A row contributes to the symptom summary only when all four severities
 * are valid. One malformed field excludes the whole row from every count
 * and from the shared denominator.
 */
function isValidSymptomFrequencyRecord(
  record: PatientReportRecord
): boolean {
  return (
    isValidReportSymptomSeverity(record.coughSeverity) &&
    isValidReportSymptomSeverity(record.wheezingSeverity) &&
    isValidReportSymptomSeverity(record.shortnessOfBreathSeverity) &&
    isValidReportSymptomSeverity(record.chestTightnessSeverity)
  );
}

function buildSymptomFrequencyItem(
  symptom: SymptomFrequencyId,
  count: number,
  totalRecords: number
): SymptomFrequencyItem {
  return {
    symptom,
    count,
    totalRecords,
    percentage: (count / totalRecords) * 100,
  };
}

/**
 * Record-level symptom presence frequencies for already-authorized
 * selected-period records.
 *
 * Presence is severity greater than zero. Counts records, not calendar
 * days. The shared denominator is the number of rows with all four valid
 * severities. Returns null when no valid row exists instead of fabricating
 * 0% values, NaN or Infinity. Does not mutate the input collection.
 */
export function calculateSymptomFrequencySummary(
  records: readonly PatientReportRecord[]
): SymptomFrequencySummary | null {
  let coughCount = 0;
  let wheezingCount = 0;
  let shortnessOfBreathCount = 0;
  let chestTightnessCount = 0;
  let totalRecords = 0;

  for (const record of records) {
    if (!isValidSymptomFrequencyRecord(record)) {
      continue;
    }

    totalRecords += 1;

    if (record.coughSeverity > 0) {
      coughCount += 1;
    }

    if (record.wheezingSeverity > 0) {
      wheezingCount += 1;
    }

    if (record.shortnessOfBreathSeverity > 0) {
      shortnessOfBreathCount += 1;
    }

    if (record.chestTightnessSeverity > 0) {
      chestTightnessCount += 1;
    }
  }

  if (totalRecords === 0) {
    return null;
  }

  return {
    totalRecords,
    items: [
      buildSymptomFrequencyItem("cough", coughCount, totalRecords),
      buildSymptomFrequencyItem("wheezing", wheezingCount, totalRecords),
      buildSymptomFrequencyItem(
        "shortnessOfBreath",
        shortnessOfBreathCount,
        totalRecords
      ),
      buildSymptomFrequencyItem(
        "chestTightness",
        chestTightnessCount,
        totalRecords
      ),
    ],
  };
}
