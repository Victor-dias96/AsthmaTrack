import type { LatestPefCardStatus } from "./latest-pef-card";
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
};

export function DashboardPageContent({
  firstName,
  latestPef = null,
  latestPefStatus,
}: DashboardPageContentProps) {
  return (
    <div className="min-w-0 space-y-6">
      <DashboardHeader firstName={firstName} />
      <DashboardPrimaryAction />
      <DashboardSummaryMetrics
        latestPef={latestPef}
        latestPefStatus={latestPefStatus}
      />
      <DashboardPeriodFilter />
      <DashboardPefChart />
      <DashboardRecentRecords />
    </div>
  );
}
