import type {
  MedicalAuthorizedPatient,
  MedicalAuthorizedPatientsResult,
} from "../types/medical-authorized-patient";
import type { MedicalAuthorizedPatientRow } from "./map-medical-authorized-patient-row";
import { matchesAuthorizedPatientName } from "./matches-authorized-patient-name";
import { normalizePatientName } from "./normalize-patient-name";
import { resolveLatestRecordSummary } from "./resolve-latest-record-summary";

/**
 * Maps already-parsed authorized-patient RPC rows into the Issue 107/108/109
 * list result. Search still matches only authorized patient names and does
 * not reorder. Latest-record summaries are resolved only for name matches
 * so a no-result search never renders another patient's PEF or date.
 *
 * Identity/authorization defects (duplicate active pairs, invalid
 * granted_at) still fail the whole list. A malformed latest-record pair
 * is isolated per card as `"unavailable"`.
 */
export function buildMedicalAuthorizedPatientsResult(
  rows: readonly MedicalAuthorizedPatientRow[],
  searchTerm = ""
): MedicalAuthorizedPatientsResult {
  if (rows.length === 0) {
    return { status: "empty" };
  }

  const seenPatientIds = new Set<string>();
  const patients: MedicalAuthorizedPatient[] = [];

  for (const row of rows) {
    // Defensive duplicate-active-pair guard. The Issue 101 partial unique
    // index on (patient_id, professional_id) where revoked_at is null
    // should make this impossible. If malformed legacy data ever produced
    // two active rows for the same patient, do not silently pick one or
    // merge them -- surface the safe unavailable state instead of hiding a
    // data-integrity defect.
    if (seenPatientIds.has(row.patientId)) {
      return { status: "unavailable" };
    }
    seenPatientIds.add(row.patientId);

    // created_at is a `not null` database-generated timestamp, but the RPC
    // response is still treated as unknown data: an unexpectedly invalid
    // value is malformed data, never replaced with the current time and
    // never rendered as "Invalid Date".
    if (Number.isNaN(new Date(row.grantedAt).getTime())) {
      return { status: "unavailable" };
    }

    if (
      searchTerm.length > 0 &&
      !matchesAuthorizedPatientName(row.patientFullName, searchTerm)
    ) {
      continue;
    }

    patients.push({
      authorizationId: row.authorizationId,
      patientId: row.patientId,
      patientName: normalizePatientName(row.patientFullName),
      authorizedAt: row.grantedAt,
      latestRecord: resolveLatestRecordSummary(
        row.latestPefValue,
        row.latestRecordedAt
      ),
    });
  }

  if (searchTerm.length > 0 && patients.length === 0) {
    return { status: "no-results" };
  }

  return { status: "ready", patients };
}
