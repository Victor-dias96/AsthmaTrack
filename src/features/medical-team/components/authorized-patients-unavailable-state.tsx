import { TriangleAlert } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { HistoryRetryButton } from "@/features/history/components/history-retry-button";

/**
 * Safe unavailable state for a failed authorized-patient query (Issue
 * 107). Never claims zero patients, never displays stale results as
 * freshly confirmed, and never exposes raw provider details, table names,
 * policy names, RPC names or role values. Reuses the existing
 * route-refresh retry control, the same cross-feature pattern as
 * src/features/access-authorizations/components/active-access-unavailable-state.tsx.
 */
export function AuthorizedPatientsUnavailableState() {
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
          <h2 className="mt-4 text-base font-semibold text-[var(--at-text-primary)]">
            Não foi possível carregar os pacientes
          </h2>

          <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
            Ocorreu um problema ao buscar os acessos autorizados. Tente
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
