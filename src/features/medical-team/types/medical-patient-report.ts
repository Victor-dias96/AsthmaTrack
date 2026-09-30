import type { PefChartPoint } from "@/features/daily-records/types/pef-chart-point";
import type { CalendarDate } from "@/features/history/lib/parse-calendar-date";
import type { PefSummary } from "@/features/reports/lib/calculate-pef-summary";
import type { RecordedAttacksSummary } from "@/features/reports/lib/calculate-recorded-attacks-summary";
import type { SymptomFrequencySummary } from "@/features/reports/lib/calculate-symptom-frequency-summary";
import type { ReportPeriod } from "@/features/reports/constants";

/**
 * Header context shared by a ready report and an authorized empty period.
 * Dates are inclusive calendar days in the product timezone. The generation
 * instant is computed once on the server and is not stored.
 */
export type MedicalPatientReportContext = {
  patientName: string;
  period: ReportPeriod;
  displayStart: CalendarDate;
  displayEnd: CalendarDate;
  generatedAtIso: string;
  generatedAtLabel: string;
};

/**
 * Selected-period summaries produced by the patient-report helpers.
 * No notes, email, record ids, patient id or authorization id.
 */
export type MedicalPatientReportSummaries = {
  recordCount: number;
  pefSummary: PefSummary | null;
  symptomSummary: SymptomFrequencySummary | null;
  attacksSummary: RecordedAttacksSummary | null;
  chartPoints: readonly PefChartPoint[];
};

/**
 * Ready report for one actively authorized patient. Summaries are the
 * patient-report calculations over the selected period only.
 */
export type MedicalPatientReportData = MedicalPatientReportContext &
  MedicalPatientReportSummaries;

/**
 * Outcome of loading one authorized patient's read-only report.
 *
 * - `ready`: authorization succeeded and the selected period has records.
 * - `empty`: authorization succeeded and the selected period has zero records.
 * - `inaccessible`: malformed, missing, revoked, or unauthorized target.
 * - `unavailable`: authorization context could not be trusted, or the
 *   period query or mapping failed. Never treated as zero records.
 */
export type MedicalPatientReportResult =
  | { status: "ready"; data: MedicalPatientReportData }
  | ({ status: "empty" } & MedicalPatientReportContext)
  | { status: "inaccessible" }
  | { status: "unavailable" };
