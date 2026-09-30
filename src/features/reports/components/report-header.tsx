import { AppCard } from "@/components/ui/app-card";
import type { CalendarDate } from "@/features/history/lib/parse-calendar-date";

import {
  REPORT_DOCUMENT_TITLE,
  REPORT_PERIOD_LABELS,
  type ReportPeriod,
} from "../constants";
import { formatReportPatientName } from "../lib/format-report-patient-name";
import { formatReportCalendarDate } from "../lib/format-report-period-dates";

const REPORT_DOCUMENT_HEADING_ID = "report-document-heading";

export type ReportHeaderProps = {
  patientName: string | null;
  period: ReportPeriod;
  displayStart: CalendarDate;
  displayEnd: CalendarDate;
  generatedAtIso: string;
  generatedAtLabel: string;
  /**
   * When false, the document title is omitted because the surrounding page
   * already rendered it as the single h1. Defaults to true so the patient
   * report markup stays unchanged.
   */
  showTitle?: boolean;
};

/**
 * Presentational report document header. Renders title, patient name,
 * inclusive selected period and generation timestamp. Performs no queries,
 * authentication or date-range calculation.
 */
export function ReportHeader({
  patientName,
  period,
  displayStart,
  displayEnd,
  generatedAtIso,
  generatedAtLabel,
  showTitle = true,
}: ReportHeaderProps) {
  const start = formatReportCalendarDate(displayStart);
  const end = formatReportCalendarDate(displayEnd);
  const displayName = formatReportPatientName(patientName);
  const periodLabel = REPORT_PERIOD_LABELS[period];

  return (
    <section
      aria-labelledby={showTitle ? REPORT_DOCUMENT_HEADING_ID : undefined}
      aria-label={showTitle ? undefined : "Dados do relatório"}
      className="report-print-section min-w-0"
    >
      <AppCard className="min-w-0">
        {showTitle ? (
          <h2
            id={REPORT_DOCUMENT_HEADING_ID}
            className="text-lg font-semibold text-[var(--at-text-primary)]"
          >
            {REPORT_DOCUMENT_TITLE}
          </h2>
        ) : null}

        <dl
          className={`grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3${showTitle ? " mt-4" : ""}`}
        >
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
              Paciente
            </dt>
            <dd className="mt-1 text-sm font-medium leading-relaxed break-words text-[var(--at-text-primary)]">
              {displayName}
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
              Período
            </dt>
            <dd className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-primary)]">
              {periodLabel}, de{" "}
              <time dateTime={start.isoDate}>{start.label}</time>
              {" "}
              a{" "}
              <time dateTime={end.isoDate}>{end.label}</time>
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
              Gerado em
            </dt>
            <dd className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-primary)]">
              <time dateTime={generatedAtIso}>{generatedAtLabel}</time>
            </dd>
          </div>
        </dl>
      </AppCard>
    </section>
  );
}
