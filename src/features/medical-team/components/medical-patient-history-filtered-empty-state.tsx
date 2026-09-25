import { ClipboardList } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import type { DashboardPeriod } from "@/features/dashboard";

const FILTERED_EMPTY_TITLE: Record<DashboardPeriod, string> = {
  7: "Nenhum registro nos últimos 7 dias",
  30: "Nenhum registro nos últimos 30 dias",
  90: "Nenhum registro nos últimos 90 dias",
};

type MedicalPatientHistoryFilteredEmptyStateProps = {
  period: DashboardPeriod;
};

/**
 * Authorized patient who has records overall, but none in the selected
 * period. No create action and no claim that the patient has zero records.
 */
export function MedicalPatientHistoryFilteredEmptyState({
  period,
}: MedicalPatientHistoryFilteredEmptyStateProps) {
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
          {FILTERED_EMPTY_TITLE[period]}
        </h2>

        <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
          Não encontramos registros neste período.
        </p>
      </div>
    </AppCard>
  );
}
