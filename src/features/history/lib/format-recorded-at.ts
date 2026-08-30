import { HISTORY_TIME_ZONE } from "../constants";

const recordedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Formats a Supabase ISO timestamp for Brazilian Portuguese display.
 * Deterministic: uses a fixed locale and timezone, never the browser zone.
 */
export function formatRecordedAt(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return recordedAtFormatter.format(date);
}
