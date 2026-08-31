import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

const SYMPTOM_SKELETON_KEYS = [
  "edit-symptom-skeleton-1",
  "edit-symptom-skeleton-2",
  "edit-symptom-skeleton-3",
  "edit-symptom-skeleton-4",
] as const;

export function DailyRecordEditFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-0.5 h-4 w-full max-w-md" />
      </div>

      <Skeleton className="h-16 w-full" />

      <AppCard>
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-1 h-4 w-full max-w-sm" />

        <div className="mt-8 space-y-8">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-4 w-56" />
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--at-border)] pt-8">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-1 h-4 w-64" />
            <div className="mt-4 space-y-4">
              {SYMPTOM_SKELETON_KEYS.map((key) => (
                <div key={key} className="min-w-0 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--at-border)] pt-8">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-1 h-4 w-72" />
            <div className="mt-4 space-y-4">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--at-border)] pt-6 sm:flex-row sm:justify-end">
          <Skeleton className="h-10 w-full sm:w-28" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
      </AppCard>
    </div>
  );
}
