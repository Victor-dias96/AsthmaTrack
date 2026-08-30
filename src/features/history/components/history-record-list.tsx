import type { DailyRecord } from "@/types/daily-record";

import { formatRecordedAt } from "../lib/format-recorded-at";

type HistoryRecordListProps = {
  records: DailyRecord[];
};

export function HistoryRecordList({ records }: HistoryRecordListProps) {
  return (
    <ul
      aria-label="Registros anteriores"
      className="min-w-0 divide-y divide-[var(--at-border)]"
    >
      {records.map((record) => (
        <li key={record.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <time
              dateTime={record.recordedAt}
              className="text-sm font-medium text-[var(--at-text-primary)]"
            >
              {formatRecordedAt(record.recordedAt)}
            </time>
            <div className="min-w-0 text-sm text-[var(--at-text-secondary)] sm:text-right">
              <p>{record.pefValue} L/min</p>
              <p>
                {record.hadAttack ? "Crise relatada" : "Sem crise relatada"}
              </p>
              <p>
                {record.usedRescueMedication
                  ? "Medicação de resgate utilizada"
                  : "Medicação de resgate não utilizada"}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
