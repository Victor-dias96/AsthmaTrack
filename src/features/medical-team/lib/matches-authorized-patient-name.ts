/**
 * Case-insensitive, accent-sensitive substring match against a patient's
 * stored `full_name` (Issue 108).
 *
 * Matching is a plain string comparison on the already-authorized set --
 * never SQL, never LIKE/ILIKE, so `%`, `_` and PostgREST-like operator
 * text are literal characters and cannot broaden authorization scope.
 * Null, empty and whitespace-only names do not match; the display fallback
 * "Nome não informado" is not searched as if it were stored data.
 */
export function matchesAuthorizedPatientName(
  fullName: string | null,
  searchTerm: string
): boolean {
  if (searchTerm.length === 0 || fullName === null) {
    return false;
  }

  const normalizedName = fullName.trim().replace(/\s+/g, " ");

  if (normalizedName.length === 0) {
    return false;
  }

  return normalizedName.toLowerCase().includes(searchTerm.toLowerCase());
}
