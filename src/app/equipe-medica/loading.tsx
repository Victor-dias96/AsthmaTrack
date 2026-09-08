import { MedicalTeamShell } from "@/features/medical-team";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level loading fallback for /equipe-medica (Issue 106). Approximates
 * the shell's shape with non-interactive, decorative-only skeletons — no
 * fake patient names, counts, or metrics. This boundary only covers
 * page.tsx/nested segments; the protected layout's own auth/role check is
 * not wrapped by it and always runs first.
 */
export default function EquipeMedicaLoading() {
  return (
    <MedicalTeamShell>
      <div className="space-y-6" aria-busy="true">
        <p className="sr-only">Carregando área da equipe médica...</p>

        <div aria-hidden="true">
          <Skeleton className="h-7 w-56 max-w-full" />
          <Skeleton className="mt-1 h-4 w-full max-w-sm" />
        </div>

        <div
          aria-hidden="true"
          className="rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4"
        >
          <Skeleton className="h-6 w-48 max-w-full" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
          <Skeleton className="mt-1 h-4 w-2/3 max-w-sm" />
        </div>
      </div>
    </MedicalTeamShell>
  );
}
