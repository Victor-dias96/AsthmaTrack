import type { LatestRecordDateCardStatus } from "./latest-record-date-card";
import type { LatestPefCardStatus } from "./latest-pef-card";
import type { DaysWithSymptomsCardStatus } from "./days-with-symptoms-card";
import type { TotalRecordsCardStatus } from "./total-records-card";
import type { RecordedAttacksCardStatus } from "./recorded-attacks-card";
import { DashboardHeader } from "./dashboard-header";
import { DashboardPeriodFilter } from "./dashboard-period-filter";
import { DashboardPefChart } from "./dashboard-pef-chart";
import { DashboardPrimaryAction } from "./dashboard-primary-action";
import { DashboardRecentRecords } from "./dashboard-recent-records";
import { DashboardSummaryMetrics } from "./dashboard-summary-metrics";

type DashboardPageContentProps = {
  firstName: string | null;
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
};

export function DashboardPageContent({
  firstName,
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
}: DashboardPageContentProps) {
  return (
    <div className="min-w-0 space-y-6">
      <DashboardHeader firstName={firstName} />
      <DashboardPrimaryAction />
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
      />
      <DashboardPeriodFilter />
      <DashboardPefChart />
      <DashboardRecentRecords />
    </div>
  );
}
