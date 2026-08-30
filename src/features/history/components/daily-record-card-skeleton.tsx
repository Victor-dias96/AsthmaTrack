import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

const SYMPTOM_SKELETON_KEYS = [
  "symptom-skeleton-1",
  "symptom-skeleton-2",
  "symptom-skeleton-3",
  "symptom-skeleton-4",
] as const;

export function DailyRecordCardSkeleton() {
  return (
    <AppCard padding="sm" className="min-w-0">
      <div aria-hidden="true" className="min-w-0 space-y-4">
        <Skeleton className="h-5 w-44" />

        <div>
          <Skeleton className="h-3 w-10" />
          <Skeleton className="mt-0.5 h-8 w-20" />
        </div>

        <dl className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {SYMPTOM_SKELETON_KEYS.map((key) => (
            <div key={key} className="min-w-0 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </dl>

        <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-1 border-t border-[var(--at-border)] pt-3 sm:grid-cols-2">
          <Skeleton className="h-4 w-full max-w-44" />
          <Skeleton className="h-4 w-full max-w-44" />
        </div>
      </div>
    </AppCard>
  );
}
