import type { DashboardPeriod } from "@/features/dashboard";

import type { MedicalPatientHistoryResult } from "../types/medical-patient-history";
import { MedicalPatientHistoryEmptyState } from "./medical-patient-history-empty-state";
import { MedicalPatientHistoryFilteredEmptyState } from "./medical-patient-history-filtered-empty-state";
import { MedicalPatientHistoryHeader } from "./medical-patient-history-header";
import { MedicalPatientHistoryPagination } from "./medical-patient-history-pagination";
import { MedicalPatientHistoryPeriodSelector } from "./medical-patient-history-period-selector";
import { MedicalPatientHistoryRecordList } from "./medical-patient-history-record-list";
import { MedicalPatientHistoryUnavailableState } from "./medical-patient-history-unavailable-state";

type MedicalPatientHistoryPageContentProps = {
  patientId: string;
  currentPeriod: DashboardPeriod;
  currentPage: number;
  result: Exclude<MedicalPatientHistoryResult, { status: "inaccessible" }>;
};

/**
 * Read-only medical history for one actively authorized patient. Renders
 * inside the existing /equipe-medica layout. Performs no query and no
 * authorization decision.
 */
export function MedicalPatientHistoryPageContent({
  patientId,
  currentPeriod,
  currentPage,
  result,
}: MedicalPatientHistoryPageContentProps) {
  if (result.status === "unavailable") {
    return (
      <div className="min-w-0 space-y-6">
        <MedicalPatientHistoryHeader patientId={patientId} patientName={null} />
        <MedicalPatientHistoryUnavailableState />
      </div>
    );
  }

  const patientName = result.patientName;

  return (
    <div className="min-w-0 space-y-6">
      <MedicalPatientHistoryHeader
        patientId={patientId}
        patientName={patientName}
      />

      <MedicalPatientHistoryPeriodSelector
        patientId={patientId}
        currentPeriod={currentPeriod}
      />

      {result.status === "empty" ? (
        <MedicalPatientHistoryEmptyState />
      ) : result.status === "filteredEmpty" ? (
        <MedicalPatientHistoryFilteredEmptyState period={currentPeriod} />
      ) : (
        <div className="space-y-3">
          <MedicalPatientHistoryRecordList records={result.records} />
          <MedicalPatientHistoryPagination
            patientId={patientId}
            currentPeriod={currentPeriod}
            currentPage={currentPage}
            totalPages={result.totalPages}
          />
        </div>
      )}
    </div>
  );
}
