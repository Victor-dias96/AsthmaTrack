import { PatientShell } from "@/components/layout/patient-shell";
import { Skeleton } from "@/components/ui/skeleton";

const PERIOD_OPTION_SKELETON_KEYS = [
  "report-period-skeleton-1",
  "report-period-skeleton-2",
  "report-period-skeleton-3",
] as const;

const HEADER_METADATA_SKELETON_KEYS = [
  "report-header-patient",
  "report-header-period",
  "report-header-generated",
] as const;

const PEF_METRIC_SKELETON_KEYS = [
  "report-pef-latest",
  "report-pef-average",
  "report-pef-minimum",
  "report-pef-maximum",
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
          <Skeleton className="h-6 w-64 max-w-full" />
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
            {HEADER_METADATA_SKELETON_KEYS.map((key) => (
              <div key={key} className="min-w-0">
                <Skeleton className="h-3 w-20 max-w-full" />
                <Skeleton className="mt-1 h-5 w-full max-w-xs" />
              </div>
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

        <div
          aria-hidden="true"
          className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-5"
        >
          <Skeleton className="h-6 w-40 max-w-full" />
          <Skeleton className="mt-1 h-4 w-64 max-w-full" />
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PEF_METRIC_SKELETON_KEYS.map((key) => (
              <div key={key} className="min-w-0">
                <Skeleton className="h-3 w-24 max-w-full" />
                <Skeleton className="mt-1 h-8 w-28 max-w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PatientShell>
  );
}
