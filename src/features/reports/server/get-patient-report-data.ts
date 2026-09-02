import { createClient } from "@/lib/supabase/server";

import { REPORT_PERIOD_RECORD_COLUMNS, type ReportPeriod } from "../constants";
import { getReportPeriodRange } from "../lib/get-report-period-range";
import {
  mapPatientReportRecordRow,
  type PatientReportRecord,
  type PatientReportRecordRow,
} from "../lib/map-patient-report-record-row";
import type { PatientReportDataResult } from "../types/patient-report-data";

type ReportSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads the authenticated patient's daily records for one validated report
 * period (Issue 90).
 *
 * - Accepts the existing authenticated server Supabase client and the
 *   already-verified patient ID; never verifies or accepts an unverified ID.
 * - Performs one `daily_records` query, explicitly filtered by `patient_id`
 *   and bounded by `recorded_at` (inclusive start, exclusive end).
 * - Uses the caller-provided `now` so query bounds match the report header.
 * - Performs no rendering, no navigation and no medical interpretation.
 * - Never uses `service_role` and never logs record contents.
 */
export async function getPatientReportData(
  supabase: ReportSupabaseClient,
  patientId: string,
  period: ReportPeriod,
  now: Date = new Date()
): Promise<PatientReportDataResult> {
  const { rangeStart, rangeEnd, displayStart, displayEnd } =
    getReportPeriodRange(period, now);

  const { data, error } = await supabase
    .from("daily_records")
    .select(REPORT_PERIOD_RECORD_COLUMNS)
    .eq("patient_id", patientId)
    .gte("recorded_at", rangeStart)
    .lt("recorded_at", rangeEnd)
    .order("recorded_at", { ascending: true })
    .order("id", { ascending: true })
    .overrideTypes<PatientReportRecordRow[], { merge: false }>();

  if (error) {
    return { status: "unavailable" };
  }

  const rows = data ?? [];

  if (rows.length === 0) {
    return { status: "empty", displayStart, displayEnd };
  }

  const records: PatientReportRecord[] = [];

  for (const row of rows) {
    const record = mapPatientReportRecordRow(row);

    if (record) {
      records.push(record);
    }
  }

  if (records.length === 0) {
    return { status: "unavailable" };
  }

  return {
    status: "ready",
    data: {
      period,
      displayStart,
      displayEnd,
      recordCount: records.length,
      records,
    },
  };
}
