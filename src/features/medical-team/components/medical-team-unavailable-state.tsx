import { TriangleAlert } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { HistoryRetryButton } from "@/features/history/components/history-retry-button";

/**
 * Safe unavailable state rendered by src/app/equipe-medica/layout.tsx when
 * the persisted-role verification query fails. A query failure is never
 * treated as a confirmed logout or as an authorized role: no medical
 * navigation, no shell, and no raw provider/table/policy detail is ever
 * rendered here. Reuses the existing route-refresh retry control (the same
 * cross-feature pattern as
 * src/features/access-authorizations/components/active-access-unavailable-state.tsx).
 */
export function MedicalTeamUnavailableState() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--at-bg-app)] px-4 py-12">
      <div className="w-full max-w-md">
        <AppCard>
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
              <h1 className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]">
                Não foi possível carregar a área da equipe médica
              </h1>

              <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
                Ocorreu um problema ao verificar o acesso. Tente novamente.
              </p>
            </div>

            <div className="mt-4">
              <HistoryRetryButton />
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  );
}
