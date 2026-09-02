import { PatientShell } from "@/components/layout/patient-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentRecordsSectionSkeleton } from "@/features/dashboard";

const SUMMARY_CARD_SKELETON_KEYS = [
  "dashboard-summary-skeleton-1",
  "dashboard-summary-skeleton-2",
  "dashboard-summary-skeleton-3",
  "dashboard-summary-skeleton-4",
  "dashboard-summary-skeleton-5",
  "dashboard-summary-skeleton-6",
] as const;

const PERIOD_OPTION_SKELETON_KEYS = [
  "dashboard-period-skeleton-1",
  "dashboard-period-skeleton-2",
  "dashboard-period-skeleton-3",
] as const;

export default function DashboardLoading() {
  return (
    <PatientShell>
      <div className="min-w-0 space-y-6" aria-busy="true">
        <p className="sr-only">Carregando dashboard...</p>

        {/* Greeting / header placeholder */}
        <div aria-hidden="true">
          <Skeleton className="h-7 w-40 max-w-full" />
          <Skeleton className="mt-1 h-4 w-full max-w-sm" />
        </div>

        {/* Daily-record action region placeholder */}
        <div
          aria-hidden="true"
          className="min-w-0 rounded-[var(--at-radius-lg)] border-2 border-[var(--at-blue)] bg-[var(--at-blue-light)] p-4"
        >
          <Skeleton className="h-6 w-32 max-w-full" />
          <Skeleton className="mt-1 h-4 w-52 max-w-full" />
          <Skeleton className="mt-4 h-12 w-full sm:w-56" />
        </div>

        {/* Six summary-metric cards placeholder */}
        <div aria-hidden="true" className="min-w-0">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="mt-1 h-4 w-64 max-w-full" />
          <ul className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SUMMARY_CARD_SKELETON_KEYS.map((key) => (
              <li key={key} className="min-w-0">
                <div className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4">
                  <Skeleton className="h-4 w-24 max-w-full" />
                  <Skeleton className="mt-2 h-8 w-16 max-w-full" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Period selector placeholder */}
        <div aria-hidden="true" className="min-w-0">
          <Skeleton className="h-3 w-16" />
          <div className="mt-2 grid min-w-0 grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {PERIOD_OPTION_SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="h-10 w-full sm:w-20" />
            ))}
          </div>
        </div>

        {/* PEF chart placeholder */}
        <div
          aria-hidden="true"
          className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4"
        >
          <Skeleton className="h-6 w-40 max-w-full" />
          <Skeleton className="mt-1 h-4 w-56 max-w-full" />
          <Skeleton className="mt-4 h-48 w-full sm:h-56 md:h-64" />
        </div>

        {/* Recent records placeholder */}
        <div
          aria-hidden="true"
          className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4"
        >
          <Skeleton className="h-6 w-40 max-w-full" />
          <Skeleton className="mt-1 h-4 w-56 max-w-full" />
          <div className="mt-4">
            <RecentRecordsSectionSkeleton />
          </div>
        </div>
      </div>
    </PatientShell>
  );
}
