import {
  mapDailyRecordRow,
  type DailyRecordRow,
} from "@/features/daily-records/lib/map-daily-record-row";
import { createClient } from "@/lib/supabase/server";
import type { DailyRecord } from "@/types/daily-record";

import {
  DAILY_RECORD_HISTORY_COLUMNS,
  HISTORY_INITIAL_LIMIT,
} from "../constants";
import type { HistoryPeriodRange } from "./get-history-period-range";
import { readPatientHistorySession } from "./read-patient-history-session";

export type { PatientHistorySession } from "./read-patient-history-session";
export { verifyPatientHistorySession } from "./read-patient-history-session";

export type LoadPatientHistoryResult =
  | { status: "ok"; records: DailyRecord[] }
  | { status: "unauthenticated" }
  | { status: "error" };

export async function loadPatientHistory(
  range: HistoryPeriodRange
): Promise<LoadPatientHistoryResult> {
  const supabase = await createClient();
  const session = await readPatientHistorySession(supabase);

  if (session.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("daily_records")
    .select(DAILY_RECORD_HISTORY_COLUMNS)
    .eq("patient_id", session.userId)
    .gte("recorded_at", range.rangeStart)
    .lt("recorded_at", range.rangeEnd)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(HISTORY_INITIAL_LIMIT)
    .overrideTypes<DailyRecordRow[], { merge: false }>();

  if (error) {
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

  return { status: "ok", records };
}
