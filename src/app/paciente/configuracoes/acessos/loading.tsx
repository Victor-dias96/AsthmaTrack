import { PatientShell } from "@/components/layout/patient-shell";
import { Skeleton } from "@/components/ui/skeleton";

const ACTIVE_ACCESS_SKELETON_ITEM_KEYS = [
  "active-access-skeleton-item-1",
  "active-access-skeleton-item-2",
] as const;

export default function AcessosLoading() {
  return (
    <PatientShell>
      <div className="mx-auto w-full max-w-2xl space-y-6" aria-busy="true">
        <p className="sr-only">Carregando acessos...</p>

        <div aria-hidden="true">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-0.5 h-4 w-full max-w-md" />
        </div>

        <div aria-hidden="true">
          <Skeleton className="h-24 w-full" />
        </div>

        <div aria-hidden="true" className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full max-w-sm" />

          <ul className="space-y-3">
            {ACTIVE_ACCESS_SKELETON_ITEM_KEYS.map((key) => (
              <li key={key}>
                <Skeleton className="h-20 w-full" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PatientShell>
  );
}
