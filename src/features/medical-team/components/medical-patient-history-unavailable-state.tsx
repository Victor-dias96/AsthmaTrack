import { TriangleAlert } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { HistoryRetryButton } from "@/features/history/components/history-retry-button";

/**
 * Query failure after the route was otherwise valid. Does not claim zero
 * records and does not expose provider errors.
 */
export function MedicalPatientHistoryUnavailableState() {
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
            Não foi possível carregar o histórico
          </h2>

          <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
            Ocorreu um problema ao buscar os dados autorizados. Tente
            novamente.
          </p>
        </div>

        <div className="mt-4">
          <HistoryRetryButton />
        </div>
      </div>
    </AppCard>
  );
}
