import { AppCard } from "@/components/ui/app-card";
import type { CalendarDate } from "@/features/history/lib/parse-calendar-date";

import { REPORT_PERIOD_LABELS, type ReportPeriod } from "../constants";
import { formatReportCalendarDate } from "../lib/format-report-period-dates";
import { formatReportRecordCount } from "../lib/format-report-record-count";

const REPORT_PERIOD_SUMMARY_HEADING_ID = "report-period-summary-heading";

type ReportPeriodSummaryProps = {
  period: ReportPeriod;
  displayStart: CalendarDate;
  displayEnd: CalendarDate;
  recordCount: number;
};

export function ReportPeriodSummary({
  period,
  displayStart,
  displayEnd,
  recordCount,
}: ReportPeriodSummaryProps) {
  const start = formatReportCalendarDate(displayStart);
  const end = formatReportCalendarDate(displayEnd);

  return (
    <section
      aria-labelledby={REPORT_PERIOD_SUMMARY_HEADING_ID}
      className="report-print-section min-w-0"
    >
      <AppCard className="min-w-0">
        <h2
          id={REPORT_PERIOD_SUMMARY_HEADING_ID}
          className="text-lg font-semibold text-[var(--at-text-primary)]"
        >
          Resumo do período
        </h2>

        <div className="mt-3 flex min-w-0 flex-col gap-2">
          <p className="text-sm font-medium text-[var(--at-text-primary)]">
            {REPORT_PERIOD_LABELS[period]}
          </p>

          <p className="text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
            De{" "}
            <time dateTime={start.isoDate}>{start.label}</time>
            {" "}
            a{" "}
            <time dateTime={end.isoDate}>{end.label}</time>
          </p>

          <p className="text-sm font-medium text-[var(--at-text-primary)]">
            {formatReportRecordCount(recordCount)}
          </p>
        </div>
      </AppCard>
    </section>
  );
}
