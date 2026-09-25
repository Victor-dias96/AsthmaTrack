import type { MedicalPatientDashboardRecord } from "./medical-patient-dashboard";

/**
 * One daily record projected for the medical history (Issue 111).
 * Same factual fields as the medical dashboard record: no id, patient id,
 * notes, createdAt or updatedAt.
 */
export type MedicalPatientHistoryRecord = MedicalPatientDashboardRecord;

/**
 * Discriminated outcome of loading one authorized patient's history.
 *
 * - `ready`: the patient is actively authorized and the selected period
 *   contains records. `records` is one page, newest `recorded_at` first.
 * - `empty`: actively authorized and the patient has zero records overall.
 * - `filteredEmpty`: actively authorized, records exist overall, and the
 *   selected period contains none.
 * - `inaccessible`: malformed, nonexistent, never-authorized, revoked, or
 *   role-mismatched. Indistinguishable from the caller's point of view.
 * - `unavailable`: a required query failed after the request was otherwise
 *   well-formed. Distinct from inaccessible and from zero records.
 */
export type MedicalPatientHistoryResult =
  | {
      status: "ready";
      patientName: string;
      records: readonly MedicalPatientHistoryRecord[];
      totalCount: number;
      totalPages: number;
    }
  | { status: "empty"; patientName: string }
  | { status: "filteredEmpty"; patientName: string }
  | { status: "inaccessible" }
  | { status: "unavailable" };
