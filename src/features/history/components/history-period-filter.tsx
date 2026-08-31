import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  HISTORY_CUSTOM_PERIOD,
  HISTORY_CUSTOM_PERIOD_PARAM,
  HISTORY_PATH,
  type HistoryFixedPeriod,
  type HistoryPeriod,
} from "../constants";
import type { HistoryFilterCustomErrors } from "../lib/parse-history-filter";
import { HistoryCustomRangeForm } from "./history-custom-range-form";

const HISTORY_PERIOD_FILTER_OPTIONS = [
  {
    period: 7,
    label: "Últimos 7 dias",
    href: `${HISTORY_PATH}?periodo=7`,
  },
  {
    period: 30,
    label: "Últimos 30 dias",
    href: `${HISTORY_PATH}?periodo=30`,
  },
  {
    period: 90,
    label: "Últimos 90 dias",
    href: `${HISTORY_PATH}?periodo=90`,
  },
] as const satisfies ReadonlyArray<{
  period: HistoryFixedPeriod;
  label: string;
  href: string;
}>;

const periodOptionClasses = [
  "inline-flex max-w-full items-center justify-center whitespace-nowrap",
  "rounded-[var(--at-radius-md)] px-3 py-1.5 text-sm outline-none",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
] as const;

type HistoryPeriodFilterProps = {
  period: HistoryPeriod;
  startValue?: string;
  endValue?: string;
  errors?: HistoryFilterCustomErrors;
};

function getCustomPeriodHref(startValue: string, endValue: string): string {
  const params = new URLSearchParams();
  params.set("periodo", HISTORY_CUSTOM_PERIOD_PARAM);

  if (startValue.length > 0) {
    params.set("inicio", startValue);
  }

  if (endValue.length > 0) {
    params.set("fim", endValue);
  }

  return `${HISTORY_PATH}?${params.toString()}`;
}

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

export function HistoryPeriodFilter({
  period,
  startValue = "",
  endValue = "",
  errors,
}: HistoryPeriodFilterProps) {
  const isCustom = period === HISTORY_CUSTOM_PERIOD;

  return (
    <div className="min-w-0">
      <p
        id="history-period-label"
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Período
      </p>

      <div
        role="group"
        aria-labelledby="history-period-label"
        className="mt-2 min-w-0"
      >
        <nav aria-labelledby="history-period-label">
          <ul className="flex min-w-0 flex-wrap gap-2">
            {HISTORY_PERIOD_FILTER_OPTIONS.map((option) => (
              <li key={option.period} className="min-w-0">
                <PeriodOptionLink
                  href={option.href}
                  label={option.label}
                  isActive={option.period === period}
                />
              </li>
            ))}
            <li className="min-w-0">
              <PeriodOptionLink
                href={getCustomPeriodHref(startValue, endValue)}
                label="Personalizado"
                isActive={isCustom}
              />
            </li>
          </ul>
        </nav>

        {isCustom ? (
          <HistoryCustomRangeForm
            startValue={startValue}
            endValue={endValue}
            errors={errors}
          />
        ) : null}
      </div>
    </div>
  );
}
