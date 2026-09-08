import type { SymptomSeverity } from "@/types/daily-record";
import type { PefChartPoint } from "@/features/daily-records/types/pef-chart-point";

/**
 * One daily record projected for the medical dashboard (Issue 110).
 * Deliberately excludes `id`, `patientId`, `notes`, `createdAt` and
 * `updatedAt` -- the medical dashboard never links to a record detail
 * route and never displays notes. Structurally identical to the patient
 * dashboard's own period-record shape
 * (src/features/dashboard/lib/map-dashboard-period-record-row.ts) so the
 * exact same `buildDashboardPeriodMetrics` calculation can be reused
 * without duplicating metric formulas.
 */
export type MedicalPatientDashboardRecord = {
  recordedAt: string;
  pefValue: number;
  coughSeverity: SymptomSeverity;
  wheezingSeverity: SymptomSeverity;
  shortnessOfBreathSeverity: SymptomSeverity;
  chestTightnessSeverity: SymptomSeverity;
  hadAttack: boolean;
  usedRescueMedication: boolean;
};

/**
 * Real dashboard data for one actively authorized patient (Issue 110).
 *
 * Period-scoped fields (`totalRecords`, `daysWithSymptoms`,
 * `recordedAttacks`, `rescueMedicationUsage`, `pefChartPoints`) reflect
 * only the validated selected period. `latestPef`, `latestRecordedAt` and
 * `recentRecords` always reflect the patient's latest records overall,
 * independent of the selected period -- mirrors
 * src/features/dashboard/types/patient-dashboard-data.ts exactly.
 */
export type MedicalPatientDashboardData = {
  patientName: string;
  latestPef: number;
  latestRecordedAt: string;
  totalRecords: number;
  daysWithSymptoms: number;
  recordedAttacks: number;
  rescueMedicationUsage: number;
  pefChartPoints: readonly PefChartPoint[];
  recentRecords: readonly MedicalPatientDashboardRecord[];
};

/**
 * Discriminated outcome of loading one authorized patient's dashboard data.
 *
 * - `ready`: at least one daily record exists overall; `data` is safe to
 *   render.
 * - `empty`: the patient is actively authorized and has zero records
 *   overall; `patientName` is still safe to display.
 * - `inaccessible`: the same safe result for a malformed, nonexistent,
 *   never-authorized, revoked, or role-mismatched target -- deliberately
 *   indistinguishable from the caller's point of view so no case can be
 *   used to enumerate which one applies.
 * - `unavailable`: a required query failed after authorization would
 *   otherwise have been confirmed; never implies zero records and never
 *   implies inaccessibility.
 */
export type MedicalPatientDashboardResult =
  | { status: "ready"; data: MedicalPatientDashboardData }
  | { status: "empty"; patientName: string }
  | { status: "inaccessible" }
  | { status: "unavailable" };
