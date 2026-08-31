import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";

import { HistoryRetryButton } from "./history-retry-button";

const secondaryActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

type DailyRecordDetailsErrorStateProps = {
  historyHref: string;
};

export function DailyRecordDetailsErrorState({
  historyHref,
}: DailyRecordDetailsErrorStateProps) {
  return (
    <AppCard className="min-w-0">
      <div className="flex flex-col items-center text-center">
        <div
          className="flex size-12 items-center justify-center rounded-full bg-[var(--at-alert-bg)]"
          aria-hidden="true"
        >
          <TriangleAlert
            className="size-6 text-[var(--at-alert-icon)]"
            strokeWidth={1.75}
          />
        </div>

        <div role="alert">
          <h2 className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]">
            Não foi possível carregar o registro
          </h2>

          <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
            Ocorreu um problema ao buscar este registro. Tente novamente.
          </p>
        </div>

        <div className="mt-4 flex w-full flex-col items-stretch justify-center gap-2 sm:w-auto sm:flex-row sm:items-center">
          <HistoryRetryButton />
          <Link href={historyHref} className={secondaryActionClasses}>
            Voltar ao histórico
          </Link>
        </div>
      </div>
    </AppCard>
  );
}
