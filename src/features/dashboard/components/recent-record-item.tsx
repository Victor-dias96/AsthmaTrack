import Link from "next/link";
import { getDailyRecordHref } from "@/features/history";
import type { DailyRecord } from "@/types/daily-record";

import {
  formatLatestRecordDateParts,
  parseLatestRecordRecordedAt,
} from "../lib/format-latest-record-date";
import { formatRecentRecordSymptomIndication } from "../lib/format-recent-record-symptom-indication";

type RecentRecordItemProps = {
  record: DailyRecord;
};

const detailsLinkClasses = [
  "inline-flex shrink-0 items-center text-sm font-medium text-[var(--at-blue)]",
  "rounded-[var(--at-radius-sm)] underline-offset-4 outline-none",
  "hover:underline",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
].join(" ");

export function RecentRecordItem({ record }: RecentRecordItemProps) {
  const parsedDate = parseLatestRecordRecordedAt(record.recordedAt);

  if (parsedDate === null) {
    return null;
  }

  const { date, time } = formatLatestRecordDateParts(parsedDate);
  const detailsHref = getDailyRecordHref(record.id);
  const symptomIndication = formatRecentRecordSymptomIndication(record);
  const detailsLabel = `Ver detalhes do registro de ${date} às ${time}`;

  return (
    <li className="min-w-0 border-b border-[var(--at-border)] py-3 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="min-w-0 break-words text-sm font-semibold text-[var(--at-text-primary)]">
            <time dateTime={record.recordedAt}>
              <span>{date}</span>
              <span className="mt-0.5 block tabular-nums text-[var(--at-text-secondary)] font-normal sm:mt-0 sm:ml-2 sm:inline">
                {time}
              </span>
            </time>
          </p>
          <p className="text-sm text-[var(--at-text-primary)]">
            PEF:{" "}
            <span className="tabular-nums">{record.pefValue}</span>{" "}
            <span aria-hidden="true">L/min</span>
            <span className="sr-only"> litros por minuto</span>
          </p>
          <p className="text-sm text-[var(--at-text-secondary)]">
            {symptomIndication}
          </p>
        </div>
        <Link href={detailsHref} aria-label={detailsLabel} className={detailsLinkClasses}>
          Ver detalhes
        </Link>
      </div>
    </li>
  );
}
