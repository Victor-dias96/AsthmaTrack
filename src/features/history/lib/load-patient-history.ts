import {
  mapDailyRecordRow,
  type DailyRecordRow,
} from "@/features/daily-records/lib/map-daily-record-row";
import { createClient } from "@/lib/supabase/server";
import type { DailyRecord } from "@/types/daily-record";

import { DAILY_RECORD_HISTORY_COLUMNS } from "../constants";
import type { HistoryPeriodRange } from "./get-history-period-range";
import {
  getHistoryPageRange,
  getHistoryTotalPages,
} from "./get-history-page-range";
import { readPatientHistorySession } from "./read-patient-history-session";

export type { PatientHistorySession } from "./read-patient-history-session";
export { verifyPatientHistorySession } from "./read-patient-history-session";

export type LoadPatientHistoryResult =
  | {
      status: "ok";
      records: DailyRecord[];
      totalCount: number;
      totalPages: number;
    }
  | { status: "unauthenticated" }
  | { status: "error" };

export async function loadPatientHistory(
  range: HistoryPeriodRange,
  page: number
): Promise<LoadPatientHistoryResult> {
  const supabase = await createClient();
  const session = await readPatientHistorySession(supabase);

  if (session.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  const { from, to } = getHistoryPageRange(page);

  const { data, error, count } = await supabase
    .from("daily_records")
    .select(DAILY_RECORD_HISTORY_COLUMNS, { count: "exact" })
    .eq("patient_id", session.userId)
    .gte("recorded_at", range.rangeStart)
    .lt("recorded_at", range.rangeEnd)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to)
    .overrideTypes<DailyRecordRow[], { merge: false }>();

  if (error) {
    return { status: "error" };
  }

  if (count === null || !Number.isSafeInteger(count) || count < 0) {
    return { status: "error" };
  }

  const rows = data ?? [];
  const records: DailyRecord[] = [];

  for (const row of rows) {
    const record = mapDailyRecordRow(row);
    if (record) {
      records.push(record);
    }
  }

  if (rows.length > 0 && records.length === 0) {
    return { status: "error" };
  }

  return {
    status: "ok",
    records,
    totalCount: count,
    totalPages: getHistoryTotalPages(count),
  };
}
