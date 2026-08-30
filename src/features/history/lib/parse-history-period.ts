import {
  HISTORY_DEFAULT_PERIOD,
  HISTORY_PERIODS,
  type HistoryPeriod,
} from "../constants";

/**
 * Resolves the history `periodo` search param to a supported fixed period.
 * Missing, repeated, malformed, and unsupported values fall back to 7.
 */
export function parseHistoryPeriod(
  value: string | string[] | undefined
): HistoryPeriod {
  if (typeof value !== "string") {
    return HISTORY_DEFAULT_PERIOD;
  }

  for (const period of HISTORY_PERIODS) {
    if (value === String(period)) {
      return period;
    }
  }

  return HISTORY_DEFAULT_PERIOD;
}
