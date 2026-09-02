import Link from "next/link";
import { cn } from "@/lib/utils";

import type { DashboardPeriod } from "../constants";
import { getDashboardPeriodHref } from "../lib/get-dashboard-period-href";

const DASHBOARD_PERIOD_OPTIONS = [
  {
    period: 7,
    label: "7 dias",
  },
  {
    period: 30,
    label: "30 dias",
  },
  {
    period: 90,
    label: "90 dias",
  },
] as const satisfies ReadonlyArray<{
  period: DashboardPeriod;
  label: string;
}>;

const periodOptionClasses = [
  "inline-flex min-h-10 w-full min-w-0 items-center justify-center",
  "whitespace-nowrap rounded-[var(--at-radius-md)] px-2 py-2 text-sm outline-none sm:w-auto sm:px-3",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
] as const;

type DashboardPeriodSelectorProps = {
  currentPeriod: DashboardPeriod;
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

export function DashboardPeriodSelector({
  currentPeriod,
}: DashboardPeriodSelectorProps) {
  return (
    <section aria-labelledby="dashboard-period-label" className="min-w-0">
      <p
        id="dashboard-period-label"
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Período
      </p>

      <nav aria-labelledby="dashboard-period-label" className="mt-2 min-w-0">
        <ul className="grid min-w-0 grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {DASHBOARD_PERIOD_OPTIONS.map((option) => (
            <li key={option.period} className="min-w-0">
              <PeriodOptionLink
                href={getDashboardPeriodHref(option.period)}
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
