import { AppCard } from "@/components/ui/app-card";

import {
  formatReportPefAverage,
  formatReportPefInteger,
  formatReportPefMeasurementCount,
} from "../lib/format-report-pef-value";
import type { PefSummary } from "../lib/calculate-pef-summary";

const REPORT_PEF_SUMMARY_HEADING_ID = "report-pef-summary-heading";
const REPORT_PEF_SUMMARY_DESCRIPTION_ID = "report-pef-summary-description";

export type ReportPefSummaryProps = {
  summary: PefSummary | null;
};

function ReportPefMetricValue({ value }: { value: string }) {
  return (
    <dd className="mt-1 min-w-0">
      <p className="min-w-0 whitespace-nowrap text-[var(--at-text-primary)]">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <span
          aria-hidden="true"
          className="ml-1 text-sm font-normal text-[var(--at-text-secondary)]"
        >
          L/min
        </span>
        <span className="sr-only"> litros por minuto</span>
      </p>
    </dd>
  );
}

function ReportPefSummaryUnavailable() {
  return (
    <>
      <h2
        id={REPORT_PEF_SUMMARY_HEADING_ID}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Resumo do PEF indisponível
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--at-text-secondary)]">
        Não foi possível calcular os valores de PEF deste período.
      </p>
    </>
  );
}

function ReportPefSummaryReady({ summary }: { summary: PefSummary }) {
  return (
    <>
      <h2
        id={REPORT_PEF_SUMMARY_HEADING_ID}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Resumo do PEF
      </h2>
      <p
        id={REPORT_PEF_SUMMARY_DESCRIPTION_ID}
        className="mt-0.5 text-sm text-[var(--at-text-secondary)]"
      >
        Valores registrados no período selecionado.
      </p>

      <dl className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
            Último valor
          </dt>
          <ReportPefMetricValue value={formatReportPefInteger(summary.latest)} />
        </div>

        <div className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
            Média
          </dt>
          <ReportPefMetricValue
            value={formatReportPefAverage(summary.average)}
          />
        </div>

        <div className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
            Menor valor
          </dt>
          <ReportPefMetricValue
            value={formatReportPefInteger(summary.minimum)}
          />
        </div>

        <div className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
            Maior valor
          </dt>
          <ReportPefMetricValue
            value={formatReportPefInteger(summary.maximum)}
          />
        </div>
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-[var(--at-text-secondary)]">
        {formatReportPefMeasurementCount(summary.measurementCount)}
      </p>
    </>
  );
}

/**
 * Presentational selected-period PEF summary. Renders already-calculated
 * statistics or a section-level unavailable state. Performs no queries,
 * authentication or statistic calculation.
 */
export function ReportPefSummary({ summary }: ReportPefSummaryProps) {
  return (
    <section
      aria-labelledby={REPORT_PEF_SUMMARY_HEADING_ID}
      className="min-w-0"
    >
      <AppCard className="min-w-0">
        {summary === null ? (
          <ReportPefSummaryUnavailable />
        ) : (
          <ReportPefSummaryReady summary={summary} />
        )}
      </AppCard>
    </section>
  );
}
