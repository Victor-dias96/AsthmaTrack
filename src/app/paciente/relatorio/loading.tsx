import { PatientShell } from "@/components/layout/patient-shell";
import { Skeleton } from "@/components/ui/skeleton";

const PERIOD_OPTION_SKELETON_KEYS = [
  "report-period-skeleton-1",
  "report-period-skeleton-2",
  "report-period-skeleton-3",
] as const;

export default function RelatorioLoading() {
  return (
    <PatientShell>
      <div className="min-w-0 space-y-6" aria-busy="true">
        <p className="sr-only">Carregando relatório...</p>

        <div aria-hidden="true">
          <Skeleton className="h-7 w-32 max-w-full" />
          <Skeleton className="mt-0.5 h-4 w-full max-w-md" />
        </div>

        <div aria-hidden="true" className="min-w-0">
          <Skeleton className="h-3 w-40 max-w-full" />
          <div className="mt-2 flex min-w-0 flex-wrap gap-2">
            {PERIOD_OPTION_SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="h-10 w-36 max-w-full" />
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-5"
        >
          <Skeleton className="h-6 w-40 max-w-full" />
          <Skeleton className="mt-3 h-4 w-32 max-w-full" />
          <Skeleton className="mt-2 h-4 w-full max-w-sm" />
          <Skeleton className="mt-2 h-4 w-44 max-w-full" />
        </div>
      </div>
    </PatientShell>
  );
}
