import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  formatLatestRecordDateParts,
  parseLatestRecordRecordedAt,
} from "../lib/format-latest-record-date";

export type LatestRecordDateCardStatus = "ready" | "loading" | "unavailable";

export type LatestRecordDateCardProps = {
  recordedAt: string | null;
  status?: LatestRecordDateCardStatus;
};

type LatestRecordDatePresentation =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "empty" }
  | { kind: "value"; recordedAt: string; date: string; time: string };

function resolveLatestRecordDatePresentation(
  recordedAt: string | null,
  status: LatestRecordDateCardStatus
): LatestRecordDatePresentation {
  if (status === "loading") {
    return { kind: "loading" };
  }

  if (status === "unavailable") {
    return { kind: "unavailable" };
  }

  if (recordedAt === null) {
    return { kind: "empty" };
  }

  const parsedDate = parseLatestRecordRecordedAt(recordedAt);

  if (parsedDate === null) {
    return { kind: "unavailable" };
  }

  const { date, time } = formatLatestRecordDateParts(parsedDate);

  return {
    kind: "value",
    recordedAt,
    date,
    time,
  };
}

function LatestRecordDateValue({
  recordedAt,
  date,
  time,
}: {
  recordedAt: string;
  date: string;
  time: string;
}) {
  return (
    <p className="mt-2 min-w-0 text-[var(--at-text-primary)]">
      <time dateTime={recordedAt} className="block min-w-0 break-words">
        <span className="text-base font-semibold">{date}</span>
        <span className="mt-0.5 block text-sm tabular-nums text-[var(--at-text-secondary)]">
          {time}
        </span>
      </time>
    </p>
  );
}

function LatestRecordDateEmptyState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Sem registros
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        A data do último registro aparecerá após sua primeira medição.
      </p>
    </div>
  );
}

function LatestRecordDateUnavailableState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Indisponível
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Não foi possível carregar a data do último registro.
      </p>
    </div>
  );
}

function LatestRecordDateLoadingState() {
  return (
    <div className="mt-2 min-w-0 space-y-2">
      <p className="sr-only">Carregando data do último registro</p>
      <Skeleton className="h-5 w-32 max-w-full" />
      <Skeleton className="h-4 w-16 max-w-full" />
    </div>
  );
}

export function LatestRecordDateCard({
  recordedAt,
  status = "ready",
}: LatestRecordDateCardProps) {
  const presentation = resolveLatestRecordDatePresentation(recordedAt, status);

  return (
    <AppCard padding="sm" className="min-w-0">
      <h3 className="text-sm font-medium text-[var(--at-text-secondary)]">
        Data do último registro
      </h3>
      {presentation.kind === "loading" ? (
        <LatestRecordDateLoadingState />
      ) : presentation.kind === "unavailable" ? (
        <LatestRecordDateUnavailableState />
      ) : presentation.kind === "empty" ? (
        <LatestRecordDateEmptyState />
      ) : (
        <LatestRecordDateValue
          recordedAt={presentation.recordedAt}
          date={presentation.date}
          time={presentation.time}
        />
      )}
    </AppCard>
  );
}
