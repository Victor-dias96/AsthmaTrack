import {
  REPORT_DEFAULT_PERIOD,
  REPORT_PERIODS,
  type ReportPeriod,
} from "../constants";

/**
 * Resolves the report `periodo` search param to a supported period.
 * Missing, repeated, malformed, and unsupported values fall back to 30
 * without throwing. Only exact allowlist strings ("7", "30", "90") are
 * accepted — never parseInt or numeric coercion.
 */
export function parseReportPeriod(
  value: string | string[] | undefined
): ReportPeriod {
  if (typeof value !== "string") {
    return REPORT_DEFAULT_PERIOD;
  }

  for (const period of REPORT_PERIODS) {
    if (value === String(period)) {
      return period;
    }
  }

  return REPORT_DEFAULT_PERIOD;
}
