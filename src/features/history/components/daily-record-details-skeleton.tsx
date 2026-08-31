import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

const SYMPTOM_SKELETON_KEYS = [
  "details-symptom-skeleton-1",
  "details-symptom-skeleton-2",
  "details-symptom-skeleton-3",
  "details-symptom-skeleton-4",
] as const;

export function DailyRecordDetailsSkeleton() {
  return (
    <div aria-hidden="true" className="min-w-0 space-y-4">
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <AppCard className="min-w-0">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-4 h-7 w-48" />
        </AppCard>
        <AppCard className="min-w-0">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="mt-4 h-8 w-28" />
        </AppCard>
      </div>

      <AppCard className="min-w-0">
        <Skeleton className="h-5 w-24" />
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {SYMPTOM_SKELETON_KEYS.map((key) => (
            <div key={key} className="min-w-0 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </AppCard>

      <AppCard className="min-w-0">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-4 h-4 w-full max-w-xs" />
        <Skeleton className="mt-2 h-4 w-full max-w-sm" />
      </AppCard>

      <AppCard className="min-w-0">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </AppCard>
    </div>
  );
}
