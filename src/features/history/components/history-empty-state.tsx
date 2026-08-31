import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { cn } from "@/lib/utils";

import type { HistoryPeriod } from "../constants";

const primaryActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "bg-[var(--at-blue)] text-white font-semibold",
  "hover:bg-[var(--at-blue-hover)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

const PERIOD_EMPTY_TITLE: Record<HistoryPeriod, string> = {
  7: "Nenhum registro nos últimos 7 dias",
  30: "Nenhum registro nos últimos 30 dias",
  90: "Nenhum registro nos últimos 90 dias",
};

type HistoryEmptyStateProps = {
  period: HistoryPeriod;
};

export function HistoryEmptyState({ period }: HistoryEmptyStateProps) {
  return (
    <AppCard className="min-w-0">
      <div className="flex flex-col items-center text-center">
        <div
          className="flex size-12 items-center justify-center rounded-full bg-[var(--at-surface-input)]"
          aria-hidden="true"
        >
          <ClipboardList
            className="size-6 text-[var(--at-text-secondary)]"
            strokeWidth={1.75}
          />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]">
          {PERIOD_EMPTY_TITLE[period]}
        </h2>

        <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
          Não encontramos registros neste período.
        </p>

        <Link
          href="/paciente/novo-registro"
          className={cn("mt-4", primaryActionClasses)}
        >
          Criar novo registro
        </Link>
      </div>
    </AppCard>
  );
}
