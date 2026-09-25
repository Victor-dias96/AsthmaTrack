import { Skeleton } from "@/components/ui/skeleton";
import { DailyRecordCardSkeleton } from "@/features/history/components/daily-record-card-skeleton";

const HISTORY_SKELETON_CARD_KEYS = [
  "medical-history-skeleton-card-1",
  "medical-history-skeleton-card-2",
  "medical-history-skeleton-card-3",
] as const;

const PERIOD_OPTION_SKELETON_KEYS = [
  "medical-history-period-skeleton-1",
  "medical-history-period-skeleton-2",
  "medical-history-period-skeleton-3",
] as const;

/**
 * Loading fallback for /equipe-medica/pacientes/[patientId]/historico.
 * Renders inside the parent MedicalTeamShell. Decorative skeletons only.
 */
export default function EquipeMedicaPacienteHistoricoLoading() {
  return (
    <div className="min-w-0 space-y-6" aria-busy="true">
      <p className="sr-only">Carregando histórico do paciente...</p>

      <div aria-hidden="true">
        <Skeleton className="h-7 w-56 max-w-full" />
        <Skeleton className="mt-1 h-4 w-full max-w-sm" />
        <Skeleton className="mt-1 h-4 w-full max-w-md" />
        <Skeleton className="mt-3 h-4 w-48 max-w-full" />
      </div>

      <div aria-hidden="true" className="min-w-0">
        <Skeleton className="h-3 w-16" />
        <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {PERIOD_OPTION_SKELETON_KEYS.map((key) => (
            <Skeleton key={key} className="h-10 w-full sm:w-32" />
          ))}
        </div>
      </div>

      <ul aria-hidden="true" className="min-w-0 space-y-4">
        {HISTORY_SKELETON_CARD_KEYS.map((key) => (
          <li key={key} className="min-w-0">
            <DailyRecordCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
