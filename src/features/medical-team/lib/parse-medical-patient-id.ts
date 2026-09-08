const MEDICAL_PATIENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates the `/equipe-medica/pacientes/[patientId]` dynamic route
 * segment before any patient-data query (Issue 110). Mirrors
 * src/features/history/lib/parse-daily-record-id.ts and
 * src/features/access-authorizations/lib/parse-access-authorization-id.ts.
 *
 * Accepts only exactly one well-formed UUID string -- arrays (a repeated
 * segment value), plain objects, empty values, whitespace, URLs, SQL
 * fragments and any other malformed shape all return null so the caller can
 * resolve through the same safe not-found behavior used for a nonexistent
 * or unauthorized patient, without ever querying daily_records or logging
 * the value.
 *
 * This is defense in depth only: a syntactically valid UUID is never
 * treated as proof of authorization. The active-authorization check
 * enforced in the database by the Issue 110 secure functions remains the
 * definitive access decision.
 */
export function parseMedicalPatientId(
  value: string | string[] | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!MEDICAL_PATIENT_ID_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}
