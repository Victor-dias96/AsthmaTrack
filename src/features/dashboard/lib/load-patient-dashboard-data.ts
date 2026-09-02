import {
  mapDailyRecordRow,
  type DailyRecordRow,
} from "@/features/daily-records/lib/map-daily-record-row";
import { getHistoryPeriodRange } from "@/features/history";
import { DAILY_RECORD_HISTORY_COLUMNS } from "@/features/history/constants";
import { createClient } from "@/lib/supabase/server";
import type { DailyRecord } from "@/types/daily-record";

import { RECENT_RECORDS_DISPLAY_LIMIT, type DashboardPeriod } from "../constants";
import type { DashboardDataResult } from "../types/patient-dashboard-data";
import { buildDashboardPeriodMetrics } from "./build-dashboard-period-metrics";
import {
  mapDashboardPeriodRecordRow,
  type DashboardPeriodRecordRow,
} from "./map-dashboard-period-record-row";

type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const DASHBOARD_PERIOD_RECORD_COLUMNS = [
  "id",
  "recorded_at",
  "pef_value",
  "cough_severity",
  "wheezing_severity",
  "shortness_of_breath_severity",
  "chest_tightness_severity",
  "had_attack",
  "used_rescue_medication",
].join(", ");

type LoadLatestOverallResult =
  | { status: "ok"; records: DailyRecord[] }
  | { status: "error" };

/**
 * Fetches the patient's latest three daily records overall (no period
 * filter), ordered newest first with a deterministic tie-break. Used for
 * `latestPef`, `latestRecordedAt` and `recentRecords`.
 *
 * A successful query with zero rows means the patient has zero records
 * overall. A successful query whose rows all fail to map (malformed data)
 * is treated as an error, mirroring the existing history loader convention,
 * since global emptiness must never be inferred from unmappable rows.
 */
async function loadLatestOverallRecords(
  supabase: DashboardSupabaseClient,
  patientId: string
): Promise<LoadLatestOverallResult> {
  const { data, error } = await supabase
    .from("daily_records")
    .select(DAILY_RECORD_HISTORY_COLUMNS)
    .eq("patient_id", patientId)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(RECENT_RECORDS_DISPLAY_LIMIT)
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

type LoadPeriodRecordsResult =
  | { status: "ok"; records: ReturnType<typeof mapDashboardPeriodRecordRow>[] }
  | { status: "error" };

/**
 * Fetches the patient's records within the validated selected period,
 * scoped by `recorded_at` using the established product timezone boundaries
 * (inclusive start, exclusive end). Used for total records, days with
 * symptoms, recorded attacks, rescue-medication usage and the PEF chart.
 */
async function loadPeriodRecords(
  supabase: DashboardSupabaseClient,
  patientId: string,
  period: DashboardPeriod
): Promise<LoadPeriodRecordsResult> {
  const { rangeStart, rangeEnd } = getHistoryPeriodRange(period);

  const { data, error } = await supabase
    .from("daily_records")
    .select(DASHBOARD_PERIOD_RECORD_COLUMNS)
    .eq("patient_id", patientId)
    .gte("recorded_at", rangeStart)
    .lt("recorded_at", rangeEnd)
    .order("recorded_at", { ascending: true })
    .order("id", { ascending: true })
    .overrideTypes<DashboardPeriodRecordRow[], { merge: false }>();

  if (error) {
    return { status: "error" };
  }

  const rows = data ?? [];

  return {
    status: "ok",
    records: rows.map((row) => mapDashboardPeriodRecordRow(row)),
  };
}

/**
 * Loads every real, typed value the authenticated patient dashboard needs
 * for one request (Issue 88).
 *
 * - Accepts the existing authenticated server Supabase client and the
 *   already-verified patient ID; never verifies or accepts an unverified ID.
 * - Performs exactly two `daily_records` queries (latest-overall and
 *   period-bounded), both explicitly filtered by `patient_id`.
 * - Performs no rendering, no navigation and no medical interpretation.
 * - Never uses `service_role` and never logs record contents.
 */
export async function loadPatientDashboardData(
  supabase: DashboardSupabaseClient,
  patientId: string,
  period: DashboardPeriod
): Promise<DashboardDataResult> {
  const latestResult = await loadLatestOverallRecords(supabase, patientId);

  if (latestResult.status === "error") {
    return { status: "unavailable" };
  }

  if (latestResult.records.length === 0) {
    return { status: "empty" };
  }

  const periodResult = await loadPeriodRecords(supabase, patientId, period);

  if (periodResult.status === "error") {
    return { status: "unavailable" };
  }

  const validPeriodRecords = periodResult.records.filter(
    (record): record is NonNullable<typeof record> => record !== null
  );
  const periodMetrics = buildDashboardPeriodMetrics(validPeriodRecords);
  const [latestRecord] = latestResult.records;

  return {
    status: "ready",
    data: {
      latestPef: latestRecord.pefValue,
      latestRecordedAt: latestRecord.recordedAt,
      totalRecords: periodMetrics.totalRecords,
      daysWithSymptoms: periodMetrics.daysWithSymptoms,
      recordedAttacks: periodMetrics.recordedAttacks,
      rescueMedicationUsage: periodMetrics.rescueMedicationUsage,
      pefChartPoints: periodMetrics.pefChartPoints,
      recentRecords: latestResult.records,
    },
  };
}
