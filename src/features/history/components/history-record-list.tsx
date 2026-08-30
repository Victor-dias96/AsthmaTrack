import type { DailyRecord } from "@/types/daily-record";

import { DailyRecordCard } from "./daily-record-card";

type HistoryRecordListProps = {
  records: DailyRecord[];
};

export function HistoryRecordList({ records }: HistoryRecordListProps) {
  return (
    <ul
      aria-label="Registros anteriores"
      className="min-w-0 space-y-4"
    >
      {records.map((record) => (
        <li key={record.id} className="min-w-0">
          <DailyRecordCard record={record} />
        </li>
      ))}
    </ul>
  );
}
