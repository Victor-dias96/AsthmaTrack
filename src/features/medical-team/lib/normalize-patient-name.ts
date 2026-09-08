/**
 * Safe fallback used only when a linked patient profile resolved
 * successfully but its full_name is null, empty or whitespace-only. Never
 * used when profile resolution itself failed -- that is a distinct,
 * malformed-data condition handled by the loader instead.
 */
export const PATIENT_NAME_FALLBACK = "Nome não informado";

/**
 * Trims and collapses repeated internal whitespace in a patient's display
 * name, preserving meaningful name order. Falls back to
 * PATIENT_NAME_FALLBACK for null, empty or whitespace-only input. Mirrors
 * src/features/access-authorizations/lib/normalize-professional-name.ts.
 */
export function normalizePatientName(fullName: string | null): string {
  if (fullName === null) {
    return PATIENT_NAME_FALLBACK;
  }

  const normalized = fullName.trim().replace(/\s+/g, " ");

  return normalized.length > 0 ? normalized : PATIENT_NAME_FALLBACK;
}
