import { PatientShell } from "@/components/layout/patient-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyRecordDetailsSkeleton } from "@/features/history/components/daily-record-details-skeleton";

export default function DailyRecordDetailsLoading() {
  return (
    <PatientShell>
      <div className="min-w-0 space-y-6" aria-busy="true">
        <p className="sr-only">Carregando registro...</p>

        <div
          aria-hidden="true"
          className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-0.5 h-4 w-full max-w-md" />
          </div>
          <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full sm:w-40" />
            <Skeleton className="h-10 w-full sm:w-44" />
          </div>
        </div>

        <DailyRecordDetailsSkeleton />
      </div>
    </PatientShell>
  );
}
