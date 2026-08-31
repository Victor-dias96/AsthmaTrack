const DAILY_RECORD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Accepts a single canonical UUID string from the details route.
 * Missing, repeated, and malformed values return null so the page can
 * not-found without querying Supabase.
 */
export function parseDailyRecordIdParam(
  value: string | string[] | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!DAILY_RECORD_ID_PATTERN.test(value)) {
    return null;
  }

  return value;
}
