/** Exact shape returned by `public.get_medical_authorized_patients`. */
export type MedicalAuthorizedPatientRow = {
  authorizationId: string;
  patientId: string;
  patientFullName: string | null;
  grantedAt: string;
  latestPefValue: number | null;
  latestRecordedAt: string | null;
};

type RawMedicalAuthorizedPatientRow = {
  authorization_id: string;
  patient_id: string;
  patient_full_name: string | null;
  granted_at: string;
  latest_pef_value?: number | null;
  latest_recorded_at?: string | null;
};

function isIdentityAuthorizedPatientRow(
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
 * Latest-record columns are optional on the wire: the Issue 107 function
 * does not return them, and an unapplied Issue 109 migration must not
 * turn a successful authorized-patient payload into a global unavailable
 * state. Absent or JSON-null values are a successful no-record summary.
 * Present values must still be a number / string -- numeric strings are
 * not coerced.
 */
function readLatestPefValue(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  return "invalid";
}

function readLatestRecordedAt(value: unknown): string | null | "invalid" {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return "invalid";
}

/**
 * Validates and extracts every row `get_medical_authorized_patients`
 * returns. The project has no generated Database types, so the RPC
 * response is treated as `unknown` and checked at runtime rather than
 * trusted via an unsafe type assertion. Returns `null` when the response
 * shape does not match what the RPC is documented to return -- the caller
 * must treat that as unavailable, never as an empty list. Mirrors
 * src/features/access-authorizations/lib/map-active-access-authorization-row.ts.
 *
 * Latest-record columns may be absent (Issue 107 RPC) or present
 * (Issue 109 RPC). Missing/null pairs become a successful no-record
 * summary. A typed-but-invalid PEF is left as a number for
 * resolveLatestRecordSummary to isolate per card. A value of the wrong
 * JSON type is not coerced; that single row is still kept and later
 * rendered as an item-level unavailable summary rather than failing the
 * complete authorized list.
 */
export function parseMedicalAuthorizedPatientRows(
  data: unknown
): MedicalAuthorizedPatientRow[] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const rows: MedicalAuthorizedPatientRow[] = [];

  for (const item of data) {
    if (!isIdentityAuthorizedPatientRow(item)) {
      return null;
    }

    const record = item as Record<string, unknown>;
    const latestPefValue = readLatestPefValue(record.latest_pef_value);
    const latestRecordedAt = readLatestRecordedAt(record.latest_recorded_at);

    // Wrong JSON types are not coerced and must not empty the whole list.
    // Force a half-populated pair so resolveLatestRecordSummary isolates an
    // item-level unavailable summary instead of "Sem registros".
    if (latestPefValue === "invalid" || latestRecordedAt === "invalid") {
      rows.push({
        authorizationId: item.authorization_id,
        patientId: item.patient_id,
        patientFullName: item.patient_full_name,
        grantedAt: item.granted_at,
        latestPefValue: null,
        latestRecordedAt: "invalid",
      });
      continue;
    }

    rows.push({
      authorizationId: item.authorization_id,
      patientId: item.patient_id,
      patientFullName: item.patient_full_name,
      grantedAt: item.granted_at,
      latestPefValue,
      latestRecordedAt,
    });
  }

  return rows;
}
