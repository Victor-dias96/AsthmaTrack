import { ClipboardList } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";

/**
 * Authorized patient with zero daily records overall. No create action.
 */
export function MedicalPatientHistoryEmptyState() {
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
          Nenhum registro disponível
        </h2>

        <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]">
          Este paciente ainda não possui registros no AsthmaTrack.
        </p>
      </div>
    </AppCard>
  );
}
