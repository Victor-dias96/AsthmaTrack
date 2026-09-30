import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  type ReportPeriod,
} from "@/features/reports/constants";

import { getMedicalPatientReportHref } from "../lib/get-medical-patient-report-href";

const periodOptionClasses = [
  "inline-flex min-h-10 w-full min-w-0 items-center justify-center",
  "whitespace-nowrap rounded-[var(--at-radius-md)] px-2 py-2 text-sm outline-none sm:w-auto sm:px-3",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
] as const;

type MedicalPatientReportPeriodSelectorProps = {
  patientId: string;
  currentPeriod: ReportPeriod;
};

/**
 * Period selector for the medical report. Fixed 7/30/90 links under this
 * patient's medical report route. Never links to the patient-owned report
 * and never carries a custom range, return URL or health value.
 */
export function MedicalPatientReportPeriodSelector({
  patientId,
  currentPeriod,
}: MedicalPatientReportPeriodSelectorProps) {
  return (
    <section aria-labelledby="medical-report-period-label" className="min-w-0">
      <p
        id="medical-report-period-label"
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Período do relatório
      </p>

      <nav aria-labelledby="medical-report-period-label" className="mt-2 min-w-0">
        <ul className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {REPORT_PERIODS.map((period) => {
            const isActive = period === currentPeriod;

            return (
              <li key={period} className="min-w-0">
                <Link
                  href={getMedicalPatientReportHref(patientId, period)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    ...periodOptionClasses,
                    isActive
                      ? "border-2 border-[var(--at-blue)] bg-[var(--at-blue-light)] font-semibold text-[var(--at-navy)]"
                      : "border border-[var(--at-border-input)] bg-[var(--at-surface)] font-medium text-[var(--at-text-primary)] hover:bg-[var(--at-surface-input)]"
                  )}
                >
                  {REPORT_PERIOD_LABELS[period]}
                  {isActive ? (
                    <span className="sr-only"> (selecionado)</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
