import {
  DASHBOARD_DEFAULT_PERIOD,
  DASHBOARD_PERIODS,
  type DashboardPeriod,
} from "../constants";

/**
 * Resolves the dashboard `periodo` search param to a supported period.
 * Missing, repeated, malformed, and unsupported values fall back to 7
 * without throwing. Only exact allowlist strings are accepted.
 */
export function parseDashboardPeriod(
  value: string | string[] | undefined
): DashboardPeriod {
  if (typeof value !== "string") {
    return DASHBOARD_DEFAULT_PERIOD;
  }

  for (const period of DASHBOARD_PERIODS) {
    if (value === String(period)) {
      return period;
    }
  }

  return DASHBOARD_DEFAULT_PERIOD;
}
