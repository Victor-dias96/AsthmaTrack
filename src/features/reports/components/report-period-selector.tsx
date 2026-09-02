import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  type ReportPeriod,
} from "../constants";
import { getReportPeriodHref } from "../lib/get-report-period-href";

const periodOptionClasses = [
  "inline-flex min-h-10 w-full min-w-0 items-center justify-center",
  "whitespace-nowrap rounded-[var(--at-radius-md)] px-3 py-2 text-sm outline-none sm:w-auto",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
] as const;

type ReportPeriodSelectorProps = {
  currentPeriod: ReportPeriod;
};

function PeriodOptionLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        ...periodOptionClasses,
        isActive
          ? "border-2 border-[var(--at-blue)] bg-[var(--at-blue-light)] font-semibold text-[var(--at-navy)]"
          : "border border-[var(--at-border-input)] bg-[var(--at-surface)] font-medium text-[var(--at-text-primary)] hover:bg-[var(--at-surface-input)]"
      )}
    >
      {label}
      {isActive ? <span className="sr-only"> (selecionado)</span> : null}
    </Link>
  );
}

export function ReportPeriodSelector({
  currentPeriod,
}: ReportPeriodSelectorProps) {
  return (
    <section aria-labelledby="report-period-label" className="min-w-0">
      <p
        id="report-period-label"
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Período do relatório
      </p>

      <nav aria-labelledby="report-period-label" className="mt-2 min-w-0">
        <ul className="flex min-w-0 flex-wrap gap-2">
          {REPORT_PERIODS.map((period) => (
            <li key={period} className="min-w-0">
              <PeriodOptionLink
                href={getReportPeriodHref(period)}
                label={REPORT_PERIOD_LABELS[period]}
                isActive={period === currentPeriod}
              />
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
