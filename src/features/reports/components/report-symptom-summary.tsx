import { AppCard } from "@/components/ui/app-card";

import type {
  SymptomFrequencyItem,
  SymptomFrequencySummary,
} from "../lib/calculate-symptom-frequency-summary";
import {
  formatReportSymptomPercentage,
  formatReportSymptomRecordPhrase,
} from "../lib/format-report-symptom-frequency";
import { REPORT_SYMPTOM_FREQUENCY_LABELS } from "../lib/report-symptom-frequency-labels";

const REPORT_SYMPTOM_SUMMARY_HEADING_ID = "report-symptom-summary-heading";
const REPORT_SYMPTOM_SUMMARY_DESCRIPTION_ID =
  "report-symptom-summary-description";

export type ReportSymptomSummaryProps = {
  summary: SymptomFrequencySummary | null;
};

function ReportSymptomFrequencyItem({
  item,
}: {
  item: SymptomFrequencyItem;
}) {
  const label = REPORT_SYMPTOM_FREQUENCY_LABELS[item.symptom];
  const countPhrase = formatReportSymptomRecordPhrase(
    item.count,
    item.totalRecords
  );
  const percentageLabel = formatReportSymptomPercentage(item.percentage);

  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
        {label}
      </dt>
      <dd className="mt-1 min-w-0">
        <p className="text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
          <span className="sr-only">presente em </span>
          {countPhrase}
        </p>
        <p className="mt-1 min-w-0 whitespace-nowrap text-[var(--at-text-primary)]">
          <span className="sr-only">equivalente a </span>
          <span className="text-2xl font-bold tabular-nums">
            {percentageLabel}
          </span>
          <span aria-hidden="true" className="text-2xl font-bold">
            %
          </span>
          <span className="sr-only"> por cento</span>
        </p>
      </dd>
    </div>
  );
}

function ReportSymptomSummaryUnavailable() {
  return (
    <>
      <h2
        id={REPORT_SYMPTOM_SUMMARY_HEADING_ID}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Resumo dos sintomas indisponível
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--at-text-secondary)]">
        Não foi possível calcular a frequência dos sintomas deste período.
      </p>
    </>
  );
}

function ReportSymptomSummaryReady({
  summary,
}: {
  summary: SymptomFrequencySummary;
}) {
  return (
    <>
      <h2
        id={REPORT_SYMPTOM_SUMMARY_HEADING_ID}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Resumo dos sintomas
      </h2>
      <p
        id={REPORT_SYMPTOM_SUMMARY_DESCRIPTION_ID}
        className="mt-0.5 text-sm text-[var(--at-text-secondary)]"
      >
        Frequência dos sintomas nos registros do período selecionado.
      </p>

      <dl className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.items.map((item) => (
          <ReportSymptomFrequencyItem key={item.symptom} item={item} />
        ))}
      </dl>
    </>
  );
}

/**
 * Presentational selected-period symptom-frequency summary. Renders
 * already-calculated frequencies or a section-level unavailable state.
 * Performs no queries, authentication or frequency calculation.
 */
export function ReportSymptomSummary({
  summary,
}: ReportSymptomSummaryProps) {
  return (
    <section
      aria-labelledby={REPORT_SYMPTOM_SUMMARY_HEADING_ID}
      className="report-print-section min-w-0"
    >
      <AppCard className="min-w-0">
        {summary === null ? (
          <ReportSymptomSummaryUnavailable />
        ) : (
          <ReportSymptomSummaryReady summary={summary} />
        )}
      </AppCard>
    </section>
  );
}
