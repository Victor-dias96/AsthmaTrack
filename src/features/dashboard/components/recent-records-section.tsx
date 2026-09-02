import Link from "next/link";
import { AppCard } from "@/components/ui/app-card";
import { HISTORY_PATH } from "@/features/history/constants";
import type { DailyRecord } from "@/types/daily-record";

import { selectRecentRecordsForDisplay } from "../lib/select-recent-records-for-display";
import { RecentRecordItem } from "./recent-record-item";
import { RecentRecordsSectionSkeleton } from "./recent-records-section-skeleton";

const RECENT_RECORDS_SECTION_TITLE_ID = "dashboard-recent-records-title";
const RECENT_RECORDS_SECTION_DESCRIPTION_ID =
  "dashboard-recent-records-description";

export type RecentRecordsSectionStatus =
  | "pending"
  | "loading"
  | "ready"
  | "unavailable";

export type RecentRecordsSectionProps = {
  records?: readonly DailyRecord[];
  status?: RecentRecordsSectionStatus;
};

const historyLinkClasses = [
  "inline-flex shrink-0 items-center text-sm font-medium text-[var(--at-blue)]",
  "rounded-[var(--at-radius-sm)] underline-offset-4 outline-none",
  "hover:underline",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
].join(" ");

function RecentRecordsSectionHeader() {
  return (
    <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2
          id={RECENT_RECORDS_SECTION_TITLE_ID}
          className="text-lg font-semibold text-[var(--at-text-primary)]"
        >
          Registros recentes
        </h2>
        <p
          id={RECENT_RECORDS_SECTION_DESCRIPTION_ID}
          className="mt-0.5 text-sm text-[var(--at-text-secondary)]"
        >
          Consulte suas medições mais recentes.
        </p>
      </div>
      <Link href={HISTORY_PATH} className={historyLinkClasses}>
        Ver histórico completo
      </Link>
    </div>
  );
}

function RecentRecordsPendingState() {
  return (
    <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
      Seus registros mais recentes serão exibidos aqui.
    </p>
  );
}

function RecentRecordsEmptyState() {
  return (
    <div className="min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Nenhum registro recente
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Adicione seu primeiro registro para acompanhar suas medições.
      </p>
    </div>
  );
}

function RecentRecordsUnavailableState() {
  return (
    <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
      Não foi possível carregar os registros recentes.
    </p>
  );
}

function RecentRecordsLoadingState() {
  return (
    <div className="min-w-0">
      <p className="sr-only">Carregando registros recentes</p>
      <RecentRecordsSectionSkeleton />
    </div>
  );
}

function RecentRecordsList({ records }: { records: readonly DailyRecord[] }) {
  const displayRecords = selectRecentRecordsForDisplay(records);

  if (displayRecords.length === 0) {
    return <RecentRecordsEmptyState />;
  }

  return (
    <ul className="min-w-0 divide-y divide-[var(--at-border)]">
      {displayRecords.map((record) => (
        <RecentRecordItem key={record.id} record={record} />
      ))}
    </ul>
  );
}

export function RecentRecordsSection({
  records = [],
  status = "pending",
}: RecentRecordsSectionProps) {
  return (
    <section aria-labelledby={RECENT_RECORDS_SECTION_TITLE_ID}>
      <AppCard className="min-w-0">
        <RecentRecordsSectionHeader />
        {status === "pending" ? (
          <RecentRecordsPendingState />
        ) : status === "loading" ? (
          <RecentRecordsLoadingState />
        ) : status === "unavailable" ? (
          <RecentRecordsUnavailableState />
        ) : (
          <RecentRecordsList records={records} />
        )}
      </AppCard>
    </section>
  );
}
