import Link from "next/link";
import { cn } from "@/lib/utils";

import type { HistoryPeriod } from "../constants";

const HISTORY_PERIOD_FILTER_OPTIONS = [
  {
    period: 7,
    label: "Últimos 7 dias",
    href: "/paciente/historico?periodo=7",
  },
] as const satisfies ReadonlyArray<{
  period: HistoryPeriod;
  label: string;
  href: string;
}>;

type HistoryPeriodFilterProps = {
  period: HistoryPeriod;
};

export function HistoryPeriodFilter({ period }: HistoryPeriodFilterProps) {
  return (
    <div className="min-w-0">
      <p
        id="history-period-label"
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Período
      </p>

      <nav aria-labelledby="history-period-label" className="mt-2">
        <ul className="flex min-w-0 flex-wrap gap-2">
          {HISTORY_PERIOD_FILTER_OPTIONS.map((option) => {
            const isActive = option.period === period;

            return (
              <li key={option.period} className="min-w-0">
                <Link
                  href={option.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex max-w-full items-center justify-center whitespace-nowrap",
                    "rounded-[var(--at-radius-md)] px-3 py-1.5 text-sm outline-none",
                    "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
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
    </div>
  );
}
