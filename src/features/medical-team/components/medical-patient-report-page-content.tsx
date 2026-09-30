import { ReportHeader } from "@/features/reports/components/report-header";
import { ReportInformationalNotice } from "@/features/reports/components/report-informational-notice";
import { ReportPeriodSummary } from "@/features/reports/components/report-period-summary";
import { ReportPefChart } from "@/features/reports/components/report-pef-chart";
import { ReportPefSummary } from "@/features/reports/components/report-pef-summary";
import { ReportRecordedAttacksSummary } from "@/features/reports/components/report-recorded-attacks-summary";
import { ReportSymptomSummary } from "@/features/reports/components/report-symptom-summary";
import type { ReportPeriod } from "@/features/reports/constants";

import type { MedicalPatientReportResult } from "../types/medical-patient-report";
import { MedicalPatientReportEmptyState } from "./medical-patient-report-empty-state";
import { MedicalPatientReportHeader } from "./medical-patient-report-header";
import { MedicalPatientReportPeriodSelector } from "./medical-patient-report-period-selector";
import { MedicalPatientReportUnavailableState } from "./medical-patient-report-unavailable-state";

type MedicalPatientReportPageContentProps = {
  patientId: string;
  currentPeriod: ReportPeriod;
  result: Exclude<MedicalPatientReportResult, { status: "inaccessible" }>;
};

/**
 * Read-only medical report for one actively authorized patient. Renders
 * inside the existing /equipe-medica layout. Performs no query, no
 * authorization decision and no print, PDF or share action.
 */
export function MedicalPatientReportPageContent({
  patientId,
  currentPeriod,
  result,
}: MedicalPatientReportPageContentProps) {
  if (result.status === "unavailable") {
    return (
      <div className="min-w-0 space-y-6">
        <MedicalPatientReportHeader patientId={patientId} patientName={null} />
        <MedicalPatientReportUnavailableState />
      </div>
    );
  }

  const report = result.status === "ready" ? result.data : result;

  return (
    <div className="min-w-0 space-y-6">
      <MedicalPatientReportHeader
        patientId={patientId}
        patientName={report.patientName}
      />

      <MedicalPatientReportPeriodSelector
        patientId={patientId}
        currentPeriod={currentPeriod}
      />

      <ReportHeader
        showTitle={false}
        patientName={report.patientName}
        period={report.period}
        displayStart={report.displayStart}
        displayEnd={report.displayEnd}
        generatedAtIso={report.generatedAtIso}
        generatedAtLabel={report.generatedAtLabel}
      />

      {result.status === "empty" ? (
        <MedicalPatientReportEmptyState />
      ) : (
        <>
          <ReportPeriodSummary
            period={result.data.period}
            displayStart={result.data.displayStart}
            displayEnd={result.data.displayEnd}
            recordCount={result.data.recordCount}
          />
          <ReportPefSummary summary={result.data.pefSummary} />
          <ReportSymptomSummary summary={result.data.symptomSummary} />
          <ReportRecordedAttacksSummary summary={result.data.attacksSummary} />
          <ReportPefChart data={result.data.chartPoints} />
        </>
      )}

      <ReportInformationalNotice />
    </div>
  );
}
