import { AppCard, AppCardHeader } from "@/components/ui/app-card";

import type { PefChartPoint } from "../types/pef-chart-point";
import { PefChartShell } from "./pef-chart-shell";

const DASHBOARD_PEF_CHART_TITLE_ID = "dashboard-pef-chart-title";
const DASHBOARD_PEF_CHART_DESCRIPTION_ID = "dashboard-pef-chart-description";

export type DashboardPefChartProps = {
  data: readonly PefChartPoint[];
};

export function DashboardPefChart({ data }: DashboardPefChartProps) {
  return (
    <section aria-labelledby={DASHBOARD_PEF_CHART_TITLE_ID}>
      <AppCard className="min-w-0">
        <AppCardHeader
          title="Evolução do PEF"
          description="O gráfico das suas medições será exibido aqui."
          titleId={DASHBOARD_PEF_CHART_TITLE_ID}
          descriptionId={DASHBOARD_PEF_CHART_DESCRIPTION_ID}
        />
        <PefChartShell
          data={data}
          titleId={DASHBOARD_PEF_CHART_TITLE_ID}
          descriptionId={DASHBOARD_PEF_CHART_DESCRIPTION_ID}
        />
      </AppCard>
    </section>
  );
}
