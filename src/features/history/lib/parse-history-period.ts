import {
  HISTORY_DEFAULT_PERIOD,
  HISTORY_FIXED_PERIODS,
  type HistoryFixedPeriod,
} from "../constants";

/**
 * Resolves the history `periodo` search param to a supported fixed period.
 * Missing, repeated, malformed, and unsupported values fall back to 7.
 * `personalizado` is handled by parseHistoryFilter, not this allowlist.
 */
export function parseHistoryPeriod(
  value: string | string[] | undefined
): HistoryFixedPeriod {
  if (typeof value !== "string") {
    return HISTORY_DEFAULT_PERIOD;
  }

  for (const period of HISTORY_FIXED_PERIODS) {
    if (value === String(period)) {
      return period;
    }
  }

  return HISTORY_DEFAULT_PERIOD;
}
