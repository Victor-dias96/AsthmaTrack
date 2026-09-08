import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ITEM_COUNT = 3;

/**
 * Route-level loading fallback for /equipe-medica/pacientes (Issues
 * 107-109). Renders inside the already-mounted MedicalTeamShell provided
 * by the parent layout (src/app/equipe-medica/layout.tsx) -- never
 * re-renders the shell, sidebar or mobile navigation itself, mirroring
 * src/app/equipe-medica/loading.tsx. Shows only non-interactive,
 * decorative-only skeletons: no fake patient names, dates, IDs, PEF
 * values, record timestamps or clinical statuses. Performs no Supabase
 * query.
 */
export default function EquipeMedicaPacientesLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p className="sr-only">Carregando pacientes...</p>

      <div aria-hidden="true">
        <Skeleton className="h-7 w-40 max-w-full" />
        <Skeleton className="mt-1 h-4 w-full max-w-sm" />
        <Skeleton className="mt-1 h-4 w-full max-w-xs" />
      </div>

      <div aria-hidden="true" className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
        <Skeleton className="h-11 w-full min-w-0 max-w-full" />
        <Skeleton className="h-10 w-full sm:w-24" />
      </div>

      <div
        aria-hidden="true"
        className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0"
      >
        {Array.from({ length: SKELETON_ITEM_COUNT }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--at-radius-md)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4"
          >
            <Skeleton className="h-5 w-2/3 max-w-full" />
            <Skeleton className="mt-2 h-4 w-1/2 max-w-full" />
            <Skeleton className="mt-2 h-4 w-3/4 max-w-full" />
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <Skeleton className="h-4 w-20 max-w-full" />
                <Skeleton className="mt-1 h-4 w-24 max-w-full" />
              </div>
              <div className="min-w-0">
                <Skeleton className="h-4 w-24 max-w-full" />
                <Skeleton className="mt-1 h-4 w-32 max-w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
