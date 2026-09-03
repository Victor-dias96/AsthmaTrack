import { AppCard } from "@/components/ui/app-card";

import type { RecordedAttacksSummary } from "../lib/calculate-recorded-attacks-summary";
import { formatReportRecordedAt } from "../lib/format-report-period-dates";
import { formatReportRecordedAttackCountParts } from "../lib/format-report-recorded-attack";

const REPORT_RECORDED_ATTACKS_SUMMARY_HEADING_ID =
  "report-recorded-attacks-summary-heading";
const REPORT_RECORDED_ATTACKS_SUMMARY_DESCRIPTION_ID =
  "report-recorded-attacks-summary-description";
const REPORT_RECORDED_ATTACKS_DATES_LABEL_ID =
  "report-recorded-attacks-dates-label";

export type ReportRecordedAttacksSummaryProps = {
  summary: RecordedAttacksSummary | null;
};

function ReportRecordedAttackDateItem({
  recordedAt,
}: {
  recordedAt: string;
}) {
  const formatted = formatReportRecordedAt(recordedAt);

  if (formatted === null) {
    return null;
  }

  return (
    <li className="min-w-0 break-words">
      <time dateTime={formatted.iso}>{formatted.label}</time>
    </li>
  );
}

function ReportRecordedAttacksSummaryUnavailable() {
  return (
    <div className="report-print-section">
      <h2
        id={REPORT_RECORDED_ATTACKS_SUMMARY_HEADING_ID}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Resumo das crises indisponível
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--at-text-secondary)]">
        Não foi possível calcular as crises registradas neste período.
      </p>
    </div>
  );
}

function ReportRecordedAttacksZeroState() {
  return (
    <p className="mt-4 text-sm leading-relaxed break-words text-[var(--at-text-primary)]">
      Nenhuma crise registrada no período selecionado.
    </p>
  );
}

function ReportRecordedAttacksList({
  summary,
}: {
  summary: RecordedAttacksSummary;
}) {
  return (
    <div className="report-print-attacks-list mt-4 min-w-0 border-t border-[var(--at-border)] pt-4">
      <p
        id={REPORT_RECORDED_ATTACKS_DATES_LABEL_ID}
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Datas das crises registradas
      </p>
      <ul
        aria-labelledby={REPORT_RECORDED_ATTACKS_DATES_LABEL_ID}
        className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--at-text-primary)]"
      >
        {summary.attacks.map((attack, itemIndex) => (
          <ReportRecordedAttackDateItem
            key={`report-recorded-attack-${itemIndex}`}
            recordedAt={attack.recordedAt}
          />
        ))}
      </ul>
    </div>
  );
}

function ReportRecordedAttacksSummaryReady({
  summary,
}: {
  summary: RecordedAttacksSummary;
}) {
  const countParts = formatReportRecordedAttackCountParts(summary.count);

  return (
    <>
      <div className="report-print-section">
        <h2
          id={REPORT_RECORDED_ATTACKS_SUMMARY_HEADING_ID}
          className="text-lg font-semibold text-[var(--at-text-primary)]"
        >
          Resumo das crises
        </h2>
        <p
          id={REPORT_RECORDED_ATTACKS_SUMMARY_DESCRIPTION_ID}
          className="mt-0.5 text-sm text-[var(--at-text-secondary)]"
        >
          Crises informadas nos registros do período selecionado.
        </p>

        {summary.count === 0 ? (
          <ReportRecordedAttacksZeroState />
        ) : (
          <p className="mt-4 min-w-0 break-words text-[var(--at-text-primary)]">
            <span className="text-2xl font-bold tabular-nums">
              {countParts.formattedCount}
            </span>
            <span className="ml-2 text-sm font-medium leading-relaxed">
              {countParts.phrase}
            </span>
          </p>
        )}
      </div>
      {summary.count > 0 ? (
        <ReportRecordedAttacksList summary={summary} />
      ) : null}
    </>
  );
}

/**
 * Presentational selected-period recorded-attack summary. Renders an
 * already-calculated count and date list, a zero-attack result, or a
 * section-level unavailable state. Performs no queries, authentication or
 * summary calculation.
 */
export function ReportRecordedAttacksSummary({
  summary,
}: ReportRecordedAttacksSummaryProps) {
  return (
    <section
      aria-labelledby={REPORT_RECORDED_ATTACKS_SUMMARY_HEADING_ID}
      className="min-w-0"
    >
      <AppCard className="min-w-0">
        {summary === null ? (
          <ReportRecordedAttacksSummaryUnavailable />
        ) : (
          <ReportRecordedAttacksSummaryReady summary={summary} />
        )}
      </AppCard>
    </section>
  );
}
