import { AppCard, AppCardHeader } from "@/components/ui/app-card";
import { PefChartShell } from "@/features/dashboard";
import type { PefChartPoint } from "@/features/daily-records/types/pef-chart-point";

const MEDICAL_DASHBOARD_PEF_CHART_TITLE_ID = "medical-dashboard-pef-chart-title";
const MEDICAL_DASHBOARD_PEF_CHART_DESCRIPTION_ID =
  "medical-dashboard-pef-chart-description";

export type MedicalPatientDashboardPefChartProps = {
  data: readonly PefChartPoint[];
};

/**
 * Thin medical wrapper around the shared, neutral PEF evolution chart
 * (Issue 110). Reuses the exact same Client Component the patient
 * dashboard uses (src/features/dashboard/components/pef-chart-shell.tsx ->
 * src/features/daily-records/components/pef-evolution-chart.tsx) with the
 * same accessible label, empty and unavailable copy -- no attack markers,
 * thresholds, zones or trend interpretation are ever added here. Mirrors
 * src/features/dashboard/components/dashboard-pef-chart.tsx.
 */
export function MedicalPatientDashboardPefChart({
  data,
}: MedicalPatientDashboardPefChartProps) {
  return (
    <section aria-labelledby={MEDICAL_DASHBOARD_PEF_CHART_TITLE_ID}>
      <AppCard className="min-w-0">
        <AppCardHeader
          title="Evolução do PEF"
          description="Valores em litros por minuto (L/min)."
          titleId={MEDICAL_DASHBOARD_PEF_CHART_TITLE_ID}
          descriptionId={MEDICAL_DASHBOARD_PEF_CHART_DESCRIPTION_ID}
        />
        <PefChartShell
          data={data}
          titleId={MEDICAL_DASHBOARD_PEF_CHART_TITLE_ID}
          descriptionId={MEDICAL_DASHBOARD_PEF_CHART_DESCRIPTION_ID}
        />
      </AppCard>
    </section>
  );
}
