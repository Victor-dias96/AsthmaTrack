import {
  mapDailyRecordRow,
  type DailyRecordRow,
} from "@/features/daily-records/lib/map-daily-record-row";
import { createClient } from "@/lib/supabase/server";
import type { DailyRecord } from "@/types/daily-record";

import {
  DAILY_RECORD_HISTORY_COLUMNS,
  HISTORY_INITIAL_LIMIT,
  type HistoryPeriod,
} from "../constants";
import { getHistoryPeriodRange } from "./get-history-period-range";

export type LoadPatientHistoryResult =
  | { status: "ok"; records: DailyRecord[] }
  | { status: "unauthenticated" }
  | { status: "error" };

export async function loadPatientHistory(
  period: HistoryPeriod
): Promise<LoadPatientHistoryResult> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData || Object.keys(claimsData).length === 0) {
    return { status: "unauthenticated" };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { rangeStart, rangeEnd } = getHistoryPeriodRange(period);

  const { data, error } = await supabase
    .from("daily_records")
    .select(DAILY_RECORD_HISTORY_COLUMNS)
    .eq("patient_id", user.id)
    .gte("recorded_at", rangeStart)
    .lt("recorded_at", rangeEnd)
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
