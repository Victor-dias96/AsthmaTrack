import type { ProfessionalSummary } from "../types/professional-summary";

/** Exact shape returned by `public.find_medical_professional_by_code`. */
export type ProfessionalLookupRow = {
  id: string;
  full_name: string | null;
};

function isProfessionalLookupRow(
  value: unknown
): value is ProfessionalLookupRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    (record.full_name === null || typeof record.full_name === "string")
  );
}

/**
 * Validates and extracts the single row `find_medical_professional_by_code`
 * returns at most one of. The project has no generated Database types, so
 * the RPC response is treated as `unknown` and checked at runtime rather
 * than trusted via an unsafe type assertion.
 */
export function parseProfessionalLookupRow(
  data: unknown
): ProfessionalLookupRow | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const [row] = data;
  return isProfessionalLookupRow(row) ? row : null;
}

/** Pure mapper from the validated RPC row to the application-facing type. */
export function mapProfessionalLookupRow(
  row: ProfessionalLookupRow
): ProfessionalSummary {
  return {
    professionalId: row.id,
    fullName: row.full_name,
  };
}
