import { DashboardHeader } from "./dashboard-header";
import { DashboardPeriodFilter } from "./dashboard-period-filter";
import { DashboardPefChart } from "./dashboard-pef-chart";
import { DashboardPrimaryAction } from "./dashboard-primary-action";
import { DashboardRecentRecords } from "./dashboard-recent-records";
import { DashboardSummaryMetrics } from "./dashboard-summary-metrics";

export function DashboardPageContent() {
  return (
    <div className="min-w-0 space-y-6">
      <DashboardHeader />
      <DashboardPrimaryAction />
      <DashboardSummaryMetrics />
      <DashboardPeriodFilter />
      <DashboardPefChart />
      <DashboardRecentRecords />
    </div>
  );
}
