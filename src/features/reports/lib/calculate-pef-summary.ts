import type { PatientReportRecord } from "./map-patient-report-record-row";
import {
  getValidReportRecordedAtMs,
  isValidReportPefValue,
} from "./is-valid-report-pef-measurement";

export type PefSummary = {
  latest: number;
  average: number;
  minimum: number;
  maximum: number;
  measurementCount: number;
};

/**
 * Descriptive PEF statistics for already-authorized selected-period records.
 *
 * A row contributes only when both `pefValue` and `recordedAt` are valid.
 * Returns null when no valid measurement exists instead of fabricating
 * zeros, NaN or infinite min/max. Does not mutate the input collection.
 */
export function calculatePefSummary(
  records: readonly PatientReportRecord[]
): PefSummary | null {
  let latest: number | null = null;
  let latestRecordedAtMs: number | null = null;
  let minimum: number | null = null;
  let maximum: number | null = null;
  let sum = 0;
  let measurementCount = 0;

  for (const record of records) {
    if (!isValidReportPefValue(record.pefValue)) {
      continue;
    }

    const recordedAtMs = getValidReportRecordedAtMs(record.recordedAt);

    if (recordedAtMs === null) {
      continue;
    }

    measurementCount += 1;
    sum += record.pefValue;

    if (minimum === null || record.pefValue < minimum) {
      minimum = record.pefValue;
    }

    if (maximum === null || record.pefValue > maximum) {
      maximum = record.pefValue;
    }

    // Equal timestamps keep the later mapped record (database order:
    // recorded_at ascending, id ascending).
    if (latestRecordedAtMs === null || recordedAtMs >= latestRecordedAtMs) {
      latestRecordedAtMs = recordedAtMs;
      latest = record.pefValue;
    }
  }

  if (
    measurementCount === 0 ||
    latest === null ||
    minimum === null ||
    maximum === null
  ) {
    return null;
  }

  return {
    latest,
    average: sum / measurementCount,
    minimum,
    maximum,
    measurementCount,
  };
}
