import type { PatientReportRecord } from "./map-patient-report-record-row";

const ISO_TIMESTAMP_PREFIX = /^\d{4}-\d{2}-\d{2}T/;

export type PefSummary = {
  latest: number;
  average: number;
  minimum: number;
  maximum: number;
  measurementCount: number;
};

/**
 * True when a mapped PEF value is a finite positive integer. Defensive
 * read-boundary check; does not clamp, round or replace invalid values.
 */
function isValidReportPefValue(value: number): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

/**
 * Parses an ISO-compatible recordedAt instant to milliseconds. Comparison
 * uses the parsed timestamp, never locale strings or the current time.
 */
function getValidRecordedAtMs(recordedAt: string): number | null {
  if (
    typeof recordedAt !== "string" ||
    !ISO_TIMESTAMP_PREFIX.test(recordedAt)
  ) {
    return null;
  }

  const recordedAtMs = new Date(recordedAt).getTime();

  if (!Number.isFinite(recordedAtMs)) {
    return null;
  }

  return recordedAtMs;
}

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

    const recordedAtMs = getValidRecordedAtMs(record.recordedAt);

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
    if (
      latestRecordedAtMs === null ||
      recordedAtMs >= latestRecordedAtMs
    ) {
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
