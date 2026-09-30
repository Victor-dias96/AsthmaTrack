import { calculatePefSummary } from "@/features/reports/lib/calculate-pef-summary";
import { calculateRecordedAttacksSummary } from "@/features/reports/lib/calculate-recorded-attacks-summary";
import { calculateSymptomFrequencySummary } from "@/features/reports/lib/calculate-symptom-frequency-summary";
import { mapReportRecordsToPefChartPoints } from "@/features/reports/lib/map-report-records-to-pef-chart-points";

import type { MedicalPatientDashboardRecord } from "../types/medical-patient-dashboard";
import type { MedicalPatientReportSummaries } from "../types/medical-patient-report";

/**
 * Selected-period report summaries for records already loaded through the
 * medical authorization RPCs (Issue 112).
 *
 * Delegates every formula to the patient-report helpers. Does not
 * reimplement PEF, symptom, attack or chart math, and does not carry
 * notes, record ids or patient ids.
 */

export function buildMedicalPatientReportSummaries(
  records: readonly MedicalPatientDashboardRecord[]
): MedicalPatientReportSummaries {
  return {
    recordCount: records.length,
    pefSummary: calculatePefSummary(records),
    symptomSummary: calculateSymptomFrequencySummary(records),
    attacksSummary: calculateRecordedAttacksSummary(records),
    chartPoints: mapReportRecordsToPefChartPoints(records),
  };
}
