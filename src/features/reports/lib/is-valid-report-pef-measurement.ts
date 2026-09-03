const ISO_TIMESTAMP_PREFIX = /^\d{4}-\d{2}-\d{2}T/;

/**
 * True when a mapped PEF value is a finite positive integer. Defensive
 * read-boundary check; does not clamp, round or replace invalid values.
 */
export function isValidReportPefValue(value: number): boolean {
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
export function getValidReportRecordedAtMs(recordedAt: string): number | null {
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
