import { TriangleAlert } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { HistoryRetryButton } from "@/features/history/components/history-retry-button";

const REPORT_ERROR_STATE_TITLE_ID = "report-error-state-title";

/**
 * Safe unavailable state for a failed report query.
 * Never claims zero records and never exposes raw provider details.
 */
export function ReportUnavailableState() {
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
          <h2
            id={REPORT_ERROR_STATE_TITLE_ID}
            className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]"
          >
            Não foi possível carregar o relatório
          </h2>

          <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
            Ocorreu um problema ao buscar seus registros. Tente novamente.
          </p>
        </div>

        <div className="mt-4">
          <HistoryRetryButton />
        </div>
      </div>
    </AppCard>
  );
}
