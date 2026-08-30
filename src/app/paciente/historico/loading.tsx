import { PatientShell } from "@/components/layout/patient-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyRecordCardSkeleton } from "@/features/history/components/daily-record-card-skeleton";

const HISTORY_SKELETON_CARD_KEYS = [
  "history-skeleton-card-1",
  "history-skeleton-card-2",
  "history-skeleton-card-3",
] as const;

export default function HistoricoLoading() {
  return (
    <PatientShell>
      <div className="space-y-6" aria-busy="true">
        <p className="sr-only">Carregando histórico...</p>

        <div aria-hidden="true">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-0.5 h-4 w-full max-w-md" />
        </div>

        <ul aria-hidden="true" className="min-w-0 space-y-4">
          {HISTORY_SKELETON_CARD_KEYS.map((key) => (
            <li key={key} className="min-w-0">
              <DailyRecordCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </PatientShell>
  );
}
