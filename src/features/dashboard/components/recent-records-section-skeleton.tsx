import { Skeleton } from "@/components/ui/skeleton";

import { RECENT_RECORDS_DISPLAY_LIMIT } from "../constants";

const SKELETON_ITEM_KEYS = Array.from(
  { length: RECENT_RECORDS_DISPLAY_LIMIT },
  (_, index) => `recent-record-skeleton-${index + 1}`
);

export function RecentRecordsSectionSkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="min-w-0 divide-y divide-[var(--at-border)]"
    >
      {SKELETON_ITEM_KEYS.map((key) => (
        <li key={key} className="min-w-0 py-3 first:pt-0">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36 max-w-full" />
              <Skeleton className="h-4 w-28 max-w-full" />
              <Skeleton className="h-4 w-44 max-w-full" />
            </div>
            <Skeleton className="h-4 w-24 max-w-full shrink-0" />
          </div>
        </li>
      ))}
    </ul>
  );
}
