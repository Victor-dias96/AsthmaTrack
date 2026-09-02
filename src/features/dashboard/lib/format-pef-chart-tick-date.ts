import { HISTORY_TIME_ZONE } from "@/features/history/constants";

const compactTickDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
});

const tickDateWithYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const tickYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  year: "numeric",
});

/**
 * Converts a Recharts tick value into a finite timestamp.
 * Accepts numeric instants and Date objects from a time scale.
 */
export function toPefChartTickTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  return null;
}

/**
 * True when supplied timestamps span more than one calendar year in the
 * product timezone. Does not use the current date.
 */
export function doesPefChartRangeCrossYears(
  timestamps: readonly number[]
): boolean {
  let firstYear: string | null = null;

  for (const timestamp of timestamps) {
    if (!Number.isFinite(timestamp)) {
      continue;
    }

    const year = tickYearFormatter.format(new Date(timestamp));

    if (firstYear === null) {
      firstYear = year;
      continue;
    }

    if (year !== firstYear) {
      return true;
    }
  }

  return false;
}

/**
 * Formats an X-axis tick as a compact Brazilian Portuguese date in the
 * product timezone. Never returns a raw ISO timestamp.
 */
export function formatPefChartTickDate(
  value: unknown,
  includeYear: boolean
): string {
  const timestamp = toPefChartTickTimestamp(value);

  if (timestamp === null) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return includeYear
    ? tickDateWithYearFormatter.format(date)
    : compactTickDateFormatter.format(date);
}
