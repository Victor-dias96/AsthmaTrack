import { HISTORY_TIME_ZONE } from "@/features/history/constants";

const latestRecordDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const latestRecordTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export type LatestRecordDateParts = {
  date: string;
  time: string;
};

/**
 * Parses a Supabase ISO timestamp without relying on browser or OS timezone.
 */
export function parseLatestRecordRecordedAt(isoTimestamp: string): Date | null {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Formats a valid Date into Brazilian Portuguese date and time parts
 * using the established product timezone.
 */
export function formatLatestRecordDateParts(
  date: Date
): LatestRecordDateParts {
  return {
    date: latestRecordDateFormatter.format(date),
    time: latestRecordTimeFormatter.format(date),
  };
}
