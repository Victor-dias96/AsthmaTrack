import { isDisplayablePefValue } from "../../daily-records/lib/is-displayable-pef-value";
import type { MedicalAuthorizedLatestRecord } from "../types/medical-authorized-patient";

/**
 * Turns the RPC's paired latest-record columns into a display summary.
 *
 * Both columns must be null (no daily records) or both must be a valid
 * PEF + timestamp from the same row. A half-populated or malformed pair
 * becomes `"unavailable"` -- never 0, never the current time, never a
 * silently older record. Does not log the values.
 */
export function resolveLatestRecordSummary(
  latestPefValue: number | null,
  latestRecordedAt: string | null
): MedicalAuthorizedLatestRecord {
  if (latestPefValue === null && latestRecordedAt === null) {
    return { kind: "empty" };
  }

  if (latestPefValue === null || latestRecordedAt === null) {
    return { kind: "unavailable" };
  }

  if (
    !Number.isFinite(latestPefValue) ||
    !isDisplayablePefValue(latestPefValue)
  ) {
    return { kind: "unavailable" };
  }

  if (Number.isNaN(new Date(latestRecordedAt).getTime())) {
    return { kind: "unavailable" };
  }

  return {
    kind: "ready",
    pefValue: latestPefValue,
    recordedAt: latestRecordedAt,
  };
}
