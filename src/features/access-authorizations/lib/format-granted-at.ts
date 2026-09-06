import { ACCESS_AUTHORIZATION_TIME_ZONE } from "../constants";

const grantedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: ACCESS_AUTHORIZATION_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Formats an authorization's `created_at` ISO timestamp for Brazilian
 * Portuguese display. Deterministic: uses a fixed locale and product
 * timezone, never the browser or server operating-system zone, and never
 * `Date.now()`. Mirrors src/features/history/lib/format-recorded-at.ts.
 *
 * Returns `null` for an invalid timestamp so the caller can apply the
 * established malformed-data policy instead of ever rendering
 * "Invalid Date" or fabricating the current time.
 */
export function formatGrantedAt(isoTimestamp: string): string | null {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return grantedAtFormatter.format(date);
}
