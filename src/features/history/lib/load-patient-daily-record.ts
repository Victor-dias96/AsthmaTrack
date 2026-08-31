import {
  mapDailyRecordRow,
  type DailyRecordRow,
} from "@/features/daily-records/lib/map-daily-record-row";
import { createClient } from "@/lib/supabase/server";
import type { DailyRecord } from "@/types/daily-record";

import { DAILY_RECORD_HISTORY_COLUMNS } from "../constants";
import { readPatientHistorySession } from "./read-patient-history-session";

export type LoadPatientDailyRecordResult =
  | { status: "ok"; record: DailyRecord }
  | { status: "unauthenticated" }
  | { status: "not-found" }
  | { status: "error" };

export async function loadPatientDailyRecord(
  recordId: string
): Promise<LoadPatientDailyRecordResult> {
  const supabase = await createClient();
  const session = await readPatientHistorySession(supabase);

  if (session.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("daily_records")
    .select(DAILY_RECORD_HISTORY_COLUMNS)
    .eq("id", recordId)
    .eq("patient_id", session.userId)
    .limit(1)
    .maybeSingle()
    .overrideTypes<DailyRecordRow, { merge: false }>();

  if (error) {
    return { status: "error" };
  }

  if (!data) {
    return { status: "not-found" };
  }

  const record = mapDailyRecordRow(data);

  if (!record) {
    return { status: "error" };
  }

  return { status: "ok", record };
}
