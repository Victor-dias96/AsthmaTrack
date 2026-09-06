/**
 * Safe fallback used only when a linked professional profile resolved
 * successfully but its full_name is null, empty or whitespace-only. Never
 * used when profile resolution itself failed -- that is a distinct,
 * malformed-data condition handled by the loader instead.
 */
export const PROFESSIONAL_NAME_FALLBACK = "Nome não informado";

/**
 * Trims and collapses repeated internal whitespace in a professional's
 * display name, preserving meaningful name order. Falls back to
 * PROFESSIONAL_NAME_FALLBACK for null, empty or whitespace-only input.
 */
export function normalizeProfessionalName(fullName: string | null): string {
  if (fullName === null) {
    return PROFESSIONAL_NAME_FALLBACK;
  }

  const normalized = fullName.trim().replace(/\s+/g, " ");

  return normalized.length > 0 ? normalized : PROFESSIONAL_NAME_FALLBACK;
}
