import type { DailyRecord } from "@/types/daily-record";

import { getDailyRecordDetailsHref } from "../lib/get-history-href";
import type { HistoryFilter } from "../lib/parse-history-filter";
import { DailyRecordCard } from "./daily-record-card";

type HistoryRecordListProps = {
  records: DailyRecord[];
  filter: HistoryFilter;
};

export function HistoryRecordList({
  records,
  filter,
}: HistoryRecordListProps) {
  return (
    <ul
      aria-label="Registros anteriores"
      className="min-w-0 space-y-4"
    >
      {records.map((record) => (
        <li key={record.id} className="min-w-0">
          <DailyRecordCard
            record={record}
            detailsHref={getDailyRecordDetailsHref(record.id, filter)}
          />
        </li>
      ))}
    </ul>
  );
}
