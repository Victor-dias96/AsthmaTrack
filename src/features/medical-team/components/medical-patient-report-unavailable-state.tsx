import { TriangleAlert } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { HistoryRetryButton } from "@/features/history/components/history-retry-button";

/**
 * Safe unavailable state for a failed medical-report query (Issue 112).
 * Never claims zero records, never exposes raw provider details, and never
 * falls back to service_role. Retry is a single user-initiated refresh.
 */
export function MedicalPatientReportUnavailableState() {
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

        <h2 className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]">
          Não foi possível carregar o relatório
        </h2>

        <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
          Ocorreu um problema ao buscar os dados autorizados. Tente novamente.
        </p>

        <div className="mt-4">
          <HistoryRetryButton />
        </div>
      </div>
    </AppCard>
  );
}
