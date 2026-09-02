import { AppAlert } from "@/components/ui/app-alert";

import type { DashboardPeriod } from "../constants";
import type { DashboardContentState } from "../types/dashboard-content-state";
import { DASHBOARD_DEFAULT_CONTENT_STATE } from "../types/dashboard-content-state";
import type { PefChartPoint } from "../types/pef-chart-point";
import type { LatestRecordDateCardStatus } from "./latest-record-date-card";
import type { LatestPefCardStatus } from "./latest-pef-card";
import type { DaysWithSymptomsCardStatus } from "./days-with-symptoms-card";
import type { TotalRecordsCardStatus } from "./total-records-card";
import type { RecordedAttacksCardStatus } from "./recorded-attacks-card";
import type { RescueMedicationUsageCardStatus } from "./rescue-medication-usage-card";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardHeader } from "./dashboard-header";
import { DashboardPeriodSelector } from "./dashboard-period-selector";
import { DashboardPefChart } from "./dashboard-pef-chart";
import { DashboardPrimaryAction } from "./dashboard-primary-action";
import {
  RecentRecordsSection,
  type RecentRecordsSectionStatus,
} from "./recent-records-section";
import { DashboardSummaryMetrics } from "./dashboard-summary-metrics";

const EMPTY_PEF_CHART_DATA: readonly PefChartPoint[] = [];

type DashboardPageContentProps = {
  firstName: string | null;
  currentPeriod: DashboardPeriod;
  contentState?: DashboardContentState;
  pefChartData?: readonly PefChartPoint[];
  latestPef?: number | null;
  latestPefStatus?: LatestPefCardStatus;
  latestRecordDate?: string | null;
  latestRecordDateStatus?: LatestRecordDateCardStatus;
  totalRecords?: number | null;
  totalRecordsStatus?: TotalRecordsCardStatus;
  daysWithSymptoms?: number | null;
  daysWithSymptomsStatus?: DaysWithSymptomsCardStatus;
  recordedAttacks?: number | null;
  recordedAttacksStatus?: RecordedAttacksCardStatus;
  rescueMedicationUsage?: number | null;
  rescueMedicationUsageStatus?: RescueMedicationUsageCardStatus;
  recentRecordsStatus?: RecentRecordsSectionStatus;
};

function DashboardUnavailableState() {
  return (
    <AppAlert variant="warning">
      Não foi possível carregar o dashboard.
    </AppAlert>
  );
}

function DashboardIntegratedContent({
  currentPeriod,
  pefChartData,
  latestPef = null,
  latestPefStatus,
  latestRecordDate = null,
  latestRecordDateStatus,
  totalRecords = null,
  totalRecordsStatus,
  daysWithSymptoms = null,
  daysWithSymptomsStatus,
  recordedAttacks = null,
  recordedAttacksStatus,
  rescueMedicationUsage = null,
  rescueMedicationUsageStatus,
  recentRecordsStatus,
}: Omit<DashboardPageContentProps, "firstName" | "contentState"> & {
  pefChartData: readonly PefChartPoint[];
}) {
  return (
    <>
      <DashboardSummaryMetrics
        latestPef={latestPef}
        latestPefStatus={latestPefStatus}
        latestRecordDate={latestRecordDate}
        latestRecordDateStatus={latestRecordDateStatus}
        totalRecords={totalRecords}
        totalRecordsStatus={totalRecordsStatus}
        daysWithSymptoms={daysWithSymptoms}
        daysWithSymptomsStatus={daysWithSymptomsStatus}
        recordedAttacks={recordedAttacks}
        recordedAttacksStatus={recordedAttacksStatus}
        rescueMedicationUsage={rescueMedicationUsage}
        rescueMedicationUsageStatus={rescueMedicationUsageStatus}
      />
      <DashboardPeriodSelector currentPeriod={currentPeriod} />
      <DashboardPefChart data={pefChartData} />
      <RecentRecordsSection status={recentRecordsStatus} />
    </>
  );
}

export function DashboardPageContent({
  firstName,
  currentPeriod,
  contentState = DASHBOARD_DEFAULT_CONTENT_STATE,
  pefChartData = EMPTY_PEF_CHART_DATA,
  latestPef = null,
  latestPefStatus,
  latestRecordDate = null,
  latestRecordDateStatus,
  totalRecords = null,
  totalRecordsStatus,
  daysWithSymptoms = null,
  daysWithSymptomsStatus,
  recordedAttacks = null,
  recordedAttacksStatus,
  rescueMedicationUsage = null,
  rescueMedicationUsageStatus,
  recentRecordsStatus,
}: DashboardPageContentProps) {
  const integratedContentProps = {
    currentPeriod,
    pefChartData,
    latestPef,
    latestPefStatus,
    latestRecordDate,
    latestRecordDateStatus,
    totalRecords,
    totalRecordsStatus,
    daysWithSymptoms,
    daysWithSymptomsStatus,
    recordedAttacks,
    recordedAttacksStatus,
    rescueMedicationUsage,
    rescueMedicationUsageStatus,
    recentRecordsStatus,
  };

  return (
    <div className="min-w-0 space-y-6">
      <DashboardHeader firstName={firstName} />
      <DashboardPrimaryAction />
      {contentState === "empty" ? (
        <>
          <DashboardEmptyState />
          <DashboardPeriodSelector currentPeriod={currentPeriod} />
        </>
      ) : contentState === "unavailable" ? (
        <DashboardUnavailableState />
      ) : (
        <DashboardIntegratedContent {...integratedContentProps} />
      )}
    </div>
  );
}
