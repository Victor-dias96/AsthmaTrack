/** Exact shape returned by `public.get_medical_authorized_patients`. */
export type MedicalAuthorizedPatientRow = {
  authorizationId: string;
  patientId: string;
  patientFullName: string | null;
  grantedAt: string;
};

type RawMedicalAuthorizedPatientRow = {
  authorization_id: string;
  patient_id: string;
  patient_full_name: string | null;
  granted_at: string;
};

function isRawMedicalAuthorizedPatientRow(
  value: unknown
): value is RawMedicalAuthorizedPatientRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.authorization_id === "string" &&
    typeof record.patient_id === "string" &&
    (record.patient_full_name === null ||
      typeof record.patient_full_name === "string") &&
    typeof record.granted_at === "string"
  );
}

/**
 * Validates and extracts every row `get_medical_authorized_patients`
 * returns. The project has no generated Database types, so the RPC
 * response is treated as `unknown` and checked at runtime rather than
 * trusted via an unsafe type assertion. Returns `null` when the response
 * shape does not match what the RPC is documented to return -- the caller
 * must treat that as unavailable, never as an empty list. Mirrors
 * src/features/access-authorizations/lib/map-active-access-authorization-row.ts.
 */
export function parseMedicalAuthorizedPatientRows(
  data: unknown
): MedicalAuthorizedPatientRow[] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const rows: MedicalAuthorizedPatientRow[] = [];

  for (const item of data) {
    if (!isRawMedicalAuthorizedPatientRow(item)) {
      return null;
    }

    rows.push({
      authorizationId: item.authorization_id,
      patientId: item.patient_id,
      patientFullName: item.patient_full_name,
      grantedAt: item.granted_at,
    });
  }

  return rows;
}
