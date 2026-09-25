import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/features/dashboard";

import { getMedicalPatientHistoryHref } from "../lib/get-medical-patient-history-href";

const MEDICAL_HISTORY_PERIOD_OPTIONS = [
  { period: 7, label: "Últimos 7 dias" },
  { period: 30, label: "Últimos 30 dias" },
  { period: 90, label: "Últimos 90 dias" },
] as const satisfies ReadonlyArray<{
  period: DashboardPeriod;
  label: string;
}>;

const periodOptionClasses = [
  "inline-flex min-h-10 w-full min-w-0 items-center justify-center",
  "whitespace-nowrap rounded-[var(--at-radius-md)] px-2 py-2 text-sm outline-none sm:w-auto sm:px-3",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
] as const;

type MedicalPatientHistoryPeriodSelectorProps = {
  patientId: string;
  currentPeriod: DashboardPeriod;
};

/**
 * Period selector for the medical history. Fixed 7/30/90 only. Each link
 * resets to page 1 and never carries a custom range or a health value.
 */
export function MedicalPatientHistoryPeriodSelector({
  patientId,
  currentPeriod,
}: MedicalPatientHistoryPeriodSelectorProps) {
  return (
    <section aria-labelledby="medical-history-period-label" className="min-w-0">
      <p
        id="medical-history-period-label"
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Período
      </p>

      <nav aria-labelledby="medical-history-period-label" className="mt-2 min-w-0">
        <ul className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {MEDICAL_HISTORY_PERIOD_OPTIONS.map((option) => {
            const isActive = option.period === currentPeriod;

            return (
              <li key={option.period} className="min-w-0">
                <Link
                  href={getMedicalPatientHistoryHref(patientId, option.period)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    ...periodOptionClasses,
                    isActive
                      ? "border-2 border-[var(--at-blue)] bg-[var(--at-blue-light)] font-semibold text-[var(--at-navy)]"
                      : "border border-[var(--at-border-input)] bg-[var(--at-surface)] font-medium text-[var(--at-text-primary)] hover:bg-[var(--at-surface-input)]"
                  )}
                >
                  {option.label}
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
