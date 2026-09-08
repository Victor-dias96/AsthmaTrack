import { Skeleton } from "@/components/ui/skeleton";
import { RecentRecordsSectionSkeleton } from "@/features/dashboard";

const SUMMARY_CARD_SKELETON_KEYS = [
  "medical-dashboard-summary-skeleton-1",
  "medical-dashboard-summary-skeleton-2",
  "medical-dashboard-summary-skeleton-3",
  "medical-dashboard-summary-skeleton-4",
  "medical-dashboard-summary-skeleton-5",
  "medical-dashboard-summary-skeleton-6",
] as const;

const PERIOD_OPTION_SKELETON_KEYS = [
  "medical-dashboard-period-skeleton-1",
  "medical-dashboard-period-skeleton-2",
  "medical-dashboard-period-skeleton-3",
] as const;

/**
 * Route-level loading fallback for
 * /equipe-medica/pacientes/[patientId] (Issue 110). Renders inside the
 * already-mounted MedicalTeamShell provided by the parent layout
 * (src/app/equipe-medica/layout.tsx) -- never re-renders the shell,
 * sidebar or mobile navigation itself, mirroring
 * src/app/equipe-medica/pacientes/loading.tsx. Shows only non-interactive,
 * decorative-only skeletons: no fake patient name, PEF value, date,
 * symptom or attack is ever rendered, and no Supabase query is performed
 * here.
 */
export default function EquipeMedicaPacienteDashboardLoading() {
  return (
    <div className="min-w-0 space-y-6" aria-busy="true">
      <p className="sr-only">Carregando dashboard do paciente...</p>

      {/* Header placeholder */}
      <div aria-hidden="true">
        <Skeleton className="h-7 w-56 max-w-full" />
        <Skeleton className="mt-1 h-4 w-full max-w-sm" />
        <Skeleton className="mt-1 h-4 w-full max-w-md" />
        <Skeleton className="mt-3 h-4 w-40 max-w-full" />
      </div>

      {/* Six summary-metric cards placeholder */}
      <div aria-hidden="true" className="min-w-0">
        <Skeleton className="h-6 w-20" />
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
        <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {PERIOD_OPTION_SKELETON_KEYS.map((key) => (
            <Skeleton key={key} className="h-10 w-full sm:w-32" />
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
  );
}
