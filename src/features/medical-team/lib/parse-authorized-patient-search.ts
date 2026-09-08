import { AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH } from "../constants/authorized-patients";

/**
 * C0 controls, DEL, and C1 controls. Rejected before whitespace
 * normalization so a tab or newline is never silently turned into a
 * name-search term.
 */
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/;

/**
 * Resolves the authorized-patient `q` search param to a normalized
 * patient-name term (Issue 108).
 *
 * Missing, repeated, non-string, control-character, whitespace-only and
 * oversized values return an empty string -- no active search -- without
 * throwing and without truncating into a different name. Portuguese
 * letters and accents are preserved. The result is never interpreted as SQL,
 * a PostgREST operator, a sort instruction or a column name.
 */
export function parseAuthorizedPatientSearch(
  value: string | string[] | undefined
): string {
  if (typeof value !== "string") {
    return "";
  }

  if (CONTROL_CHARACTERS.test(value)) {
    return "";
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length > AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH) {
    return "";
  }

  return normalized;
}
