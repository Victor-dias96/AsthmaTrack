import { TriangleAlert } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { HistoryRetryButton } from "@/features/history/components/history-retry-button";

/**
 * Safe unavailable state for a failed active-authorization or
 * professional-summary query (Issue 104). Never claims zero active access
 * and never exposes raw provider details, table names, policy names or
 * constraint names. Reuses the existing route-refresh retry control, the
 * same cross-feature pattern already used by
 * src/features/dashboard/components/dashboard-error-state.tsx.
 */
export function ActiveAccessUnavailableState() {
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
          <h3 className="mt-4 text-base font-semibold text-[var(--at-text-primary)]">
            Não foi possível carregar os acessos ativos
          </h3>

          <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
            Ocorreu um problema ao buscar suas autorizações. Tente novamente.
          </p>
        </div>

        <div className="mt-4">
          <HistoryRetryButton />
        </div>
      </div>
    </AppCard>
  );
}
