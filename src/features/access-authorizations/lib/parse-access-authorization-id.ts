const ACCESS_AUTHORIZATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const AUTHORIZATION_REVOKE_INVALID_ID_MESSAGE =
  "Não foi possível identificar a autorização.";

/**
 * Validates one canonical UUID authorization id immediately before it is
 * used in the Issue 105 revocation mutation. Mirrors
 * src/features/history/lib/parse-daily-record-id.ts. Accepts only exactly
 * one well-formed UUID string -- arrays, plain objects, empty values,
 * excess whitespace-only input, URLs, SQL fragments and any other malformed
 * shape all return null so the caller can show the safe generic
 * AUTHORIZATION_REVOKE_INVALID_ID_MESSAGE instead of sending an unvalidated
 * value to Supabase.
 *
 * This is defense in depth only: a syntactically valid UUID is never
 * treated as proof of ownership. RLS and the `patient_id = auth.uid()`
 * filter applied alongside it remain the definitive authorization check.
 */
export function parseAccessAuthorizationId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!ACCESS_AUTHORIZATION_ID_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}
