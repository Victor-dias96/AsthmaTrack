import { HISTORY_TIME_ZONE } from "@/features/history/constants";

const pefChartDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const pefChartTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export type PefChartDateTimeParts = {
  date: string;
  time: string;
};

function parsePefChartRecordedAt(isoTimestamp: string): Date | null {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Formats a valid Date as Brazilian Portuguese date and time parts
 * using the established product timezone. Never uses the browser zone.
 */
export function formatPefChartDateTime(
  date: Date
): PefChartDateTimeParts | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    date: pefChartDateFormatter.format(date),
    time: pefChartTimeFormatter.format(date),
  };
}

/**
 * Formats a recorded ISO timestamp for PEF chart tooltip, summary and
 * accessible measurement text.
 */
export function formatPefChartDateTimeFromIso(
  isoTimestamp: string
): PefChartDateTimeParts | null {
  const date = parsePefChartRecordedAt(isoTimestamp);

  if (date === null) {
    return null;
  }

  return formatPefChartDateTime(date);
}
