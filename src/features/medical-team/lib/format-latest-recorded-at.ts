import { MEDICAL_AUTHORIZED_PATIENTS_TIME_ZONE } from "../constants/authorized-patients";

const latestRecordedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MEDICAL_AUTHORIZED_PATIENTS_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Formats a latest daily-record `recorded_at` ISO timestamp for Brazilian
 * Portuguese display. Deterministic: uses a fixed locale and product
 * timezone (America/Maceio), never the browser or server operating-system
 * zone, and never `Date.now()`. Compact form (`08/09/2026, 14:30`) matches
 * the authorization-date formatter on the same card.
 *
 * Returns `null` for an invalid timestamp so the caller can apply the
 * malformed-data policy instead of ever rendering "Invalid Date" or
 * fabricating the current time.
 */
export function formatLatestRecordedAt(isoTimestamp: string): string | null {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return latestRecordedAtFormatter.format(date);
}
