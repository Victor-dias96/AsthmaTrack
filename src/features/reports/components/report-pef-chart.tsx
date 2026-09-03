import { AppCard } from "@/components/ui/app-card";
import { PefEvolutionChart } from "@/features/daily-records/components/pef-evolution-chart";
import type { PefChartPoint } from "@/features/daily-records/types/pef-chart-point";

const REPORT_PEF_CHART_HEADING_ID = "report-pef-chart-heading";
const REPORT_PEF_CHART_DESCRIPTION_ID = "report-pef-chart-description";

export type ReportPefChartProps = {
  data: readonly PefChartPoint[];
  state?: "ready" | "unavailable";
};

function ReportPefChartUnavailable() {
  return (
    <>
      <h2
        id={REPORT_PEF_CHART_HEADING_ID}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Gráfico de PEF indisponível
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--at-text-secondary)]">
        Não foi possível exibir as medições de PEF deste período.
      </p>
    </>
  );
}

function ReportPefChartReady({ data }: { data: readonly PefChartPoint[] }) {
  return (
    <>
      <h2
        id={REPORT_PEF_CHART_HEADING_ID}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Evolução do PEF
      </h2>
      <div id={REPORT_PEF_CHART_DESCRIPTION_ID}>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Medições registradas no período selecionado.
        </p>
        <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
          PEF em litros por minuto (L/min)
        </p>
      </div>
      <div className="mt-4 min-w-0">
        <PefEvolutionChart
          data={data}
          titleId={REPORT_PEF_CHART_HEADING_ID}
          descriptionId={REPORT_PEF_CHART_DESCRIPTION_ID}
          accessibleLabel="Evolução do PEF"
          emptyMessage="Não foi possível exibir as medições de PEF deste período."
          unavailableMessage="Não foi possível exibir as medições de PEF deste período."
        />
      </div>
    </>
  );
}

/**
 * Presentational selected-period PEF evolution chart. Renders already-mapped
 * chart points or a section-level unavailable state. Performs no queries,
 * authentication or record mapping.
 */
export function ReportPefChart({ data, state }: ReportPefChartProps) {
  const isUnavailable = state === "unavailable" || data.length === 0;

  return (
    <section aria-labelledby={REPORT_PEF_CHART_HEADING_ID} className="min-w-0">
      <AppCard className="min-w-0">
        {isUnavailable ? (
          <ReportPefChartUnavailable />
        ) : (
          <ReportPefChartReady data={data} />
        )}
      </AppCard>
    </section>
  );
}
