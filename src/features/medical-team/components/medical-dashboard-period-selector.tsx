import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/features/dashboard";

import { getMedicalPatientDashboardPeriodHref } from "../lib/get-medical-patient-dashboard-period-href";

const MEDICAL_DASHBOARD_PERIOD_OPTIONS = [
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

type MedicalPeriodOptionLinkProps = {
  href: string;
  label: string;
  isActive: boolean;
};

function MedicalPeriodOptionLink({
  href,
  label,
  isActive,
}: MedicalPeriodOptionLinkProps) {
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

type MedicalDashboardPeriodSelectorProps = {
  patientId: string;
  currentPeriod: DashboardPeriod;
};

/**
 * Read-only period selector for the medical patient dashboard (Issue 110).
 * Mirrors src/features/dashboard/components/dashboard-period-selector.tsx,
 * but every link targets the current authorized patient's own dynamic
 * route (`/equipe-medica/pacientes/[patientId]`) with only `periodo` set --
 * never a patient-only destination, never an arbitrary return URL, never
 * the patient name or a health value in the query string.
 */
export function MedicalDashboardPeriodSelector({
  patientId,
  currentPeriod,
}: MedicalDashboardPeriodSelectorProps) {
  return (
    <section
      aria-labelledby="medical-dashboard-period-label"
      className="min-w-0"
    >
      <p
        id="medical-dashboard-period-label"
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Período
      </p>

      <nav
        aria-labelledby="medical-dashboard-period-label"
        className="mt-2 min-w-0"
      >
        <ul className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {MEDICAL_DASHBOARD_PERIOD_OPTIONS.map((option) => (
            <li key={option.period} className="min-w-0">
              <MedicalPeriodOptionLink
                href={getMedicalPatientDashboardPeriodHref(
                  patientId,
                  option.period
                )}
                label={option.label}
                isActive={option.period === currentPeriod}
              />
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
