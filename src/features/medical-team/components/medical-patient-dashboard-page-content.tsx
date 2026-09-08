import {
  DaysWithSymptomsCard,
  LatestPefCard,
  LatestRecordDateCard,
  RecordedAttacksCard,
  RescueMedicationUsageCard,
  TotalRecordsCard,
  type DashboardPeriod,
} from "@/features/dashboard";

import { MedicalDashboardPeriodSelector } from "./medical-dashboard-period-selector";
import { MedicalPatientDashboardHeader } from "./medical-patient-dashboard-header";
import { MedicalPatientDashboardPefChart } from "./medical-patient-dashboard-pef-chart";
import { MedicalPatientDashboardUnavailableState } from "./medical-patient-dashboard-unavailable-state";
import { MedicalPatientEmptyState } from "./medical-patient-empty-state";
import { MedicalRecentRecordsSection } from "./medical-recent-records-section";
import type { MedicalPatientDashboardResult } from "../types/medical-patient-dashboard";

type MedicalPatientDashboardPageContentProps = {
  patientId: string;
  currentPeriod: DashboardPeriod;
  /**
   * The page (src/app/equipe-medica/pacientes/[patientId]/page.tsx) calls
   * notFound() for an "inaccessible" result before this component ever
   * renders, so only the remaining, always-safe-to-render states reach it.
   */
  result: Exclude<MedicalPatientDashboardResult, { status: "inaccessible" }>;
};

/**
 * Composes the medical patient dashboard's header plus one of: the
 * unavailable state, the empty state, or the full read-only dashboard
 * (six summary cards, period selector, PEF chart, recent records) for one
 * actively authorized patient (Issue 110).
 *
 * Purely presentational: performs no Supabase query, no authentication and
 * no authorization decision. Renders inside the existing
 * /equipe-medica nested layout (src/app/equipe-medica/layout.tsx) --
 * never re-renders MedicalTeamShell, the sidebar or mobile navigation.
 */
export function MedicalPatientDashboardPageContent({
  patientId,
  currentPeriod,
  result,
}: MedicalPatientDashboardPageContentProps) {
  if (result.status === "unavailable") {
    return (
      <div className="min-w-0 space-y-6">
        <MedicalPatientDashboardHeader patientName={null} />
        <MedicalPatientDashboardUnavailableState />
      </div>
    );
  }

  if (result.status === "empty") {
    return (
      <div className="min-w-0 space-y-6">
        <MedicalPatientDashboardHeader patientName={result.patientName} />
        <MedicalPatientEmptyState />
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="min-w-0 space-y-6">
      <MedicalPatientDashboardHeader patientName={data.patientName} />

      <section
        aria-labelledby="medical-dashboard-summary-heading"
        className="min-w-0"
      >
        <h2
          id="medical-dashboard-summary-heading"
          className="text-lg font-semibold text-[var(--at-text-primary)]"
        >
          Resumo
        </h2>

        <ul className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li className="min-w-0">
            <LatestPefCard pefValue={data.latestPef} />
          </li>
          <li className="min-w-0">
            <LatestRecordDateCard recordedAt={data.latestRecordedAt} />
          </li>
          <li className="min-w-0">
            <TotalRecordsCard totalRecords={data.totalRecords} />
          </li>
          <li className="min-w-0">
            <DaysWithSymptomsCard daysWithSymptoms={data.daysWithSymptoms} />
          </li>
          <li className="min-w-0">
            <RecordedAttacksCard recordedAttacks={data.recordedAttacks} />
          </li>
          <li className="min-w-0">
            <RescueMedicationUsageCard
              rescueMedicationUsage={data.rescueMedicationUsage}
            />
          </li>
        </ul>
      </section>

      <MedicalDashboardPeriodSelector
        patientId={patientId}
        currentPeriod={currentPeriod}
      />

      <MedicalPatientDashboardPefChart data={data.pefChartPoints} />

      <MedicalRecentRecordsSection records={data.recentRecords} />
    </div>
  );
}
