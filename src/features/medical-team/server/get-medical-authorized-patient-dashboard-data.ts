import { buildDashboardPeriodMetrics } from "@/features/dashboard/lib/build-dashboard-period-metrics";
import type { DashboardPeriod } from "@/features/dashboard/constants";
import { getHistoryPeriodRange } from "@/features/history";
import { createClient } from "@/lib/supabase/server";

import {
  MEDICAL_DASHBOARD_RECENT_RECORDS_LIMIT,
  normalizeMedicalDashboardRpcRows,
  parseMedicalPatientLatestRecordsRows,
  parseMedicalPatientPeriodRecordsRows,
} from "../lib/map-medical-patient-dashboard-record-row";
import type { MedicalPatientDashboardResult } from "../types/medical-patient-dashboard";

type MedicalTeamSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads every real, typed value the medical dashboard needs for one
 * actively authorized patient, for exactly one request (Issue 110).
 *
 * - Accepts the existing request-bound authenticated server Supabase
 *   client, an already-validated patient ID (see
 *   ../lib/parse-medical-patient-id.ts) and an already-validated period
 *   (the shared src/features/dashboard `parseDashboardPeriod`). Never
 *   accepts or derives a professional ID from the caller -- both RPCs
 *   below derive it exclusively from `auth.uid()` and re-verify the
 *   caller's persisted medical role and an active authorization to
 *   `patientId` on every call.
 * - Performs exactly two `public.daily_records`-touching queries,
 *   mirroring src/features/dashboard/lib/load-patient-dashboard-data.ts:
 *   one bounded latest-overall RPC call (also resolves the patient's
 *   display name and doubles as the authorization check -- zero rows
 *   means not authorized, not found, revoked, or role-mismatched, all
 *   collapsed into the same safe "inaccessible" result) and one
 *   period-bounded RPC call for the four period metrics and the PEF
 *   chart. Never a broader daily_records scan, never N+1.
 * - Reuses the exact patient-dashboard period-metric calculation
 *   (buildDashboardPeriodMetrics) so the medical and patient dashboards
 *   stay numerically consistent for the same patient and period by
 *   construction, not by duplicated formulas.
 * - Performs no rendering, no navigation and no medical interpretation.
 * - Never uses `service_role`, never returns a raw Supabase error, and
 *   never logs the patient ID, patient name or record contents.
 */
export async function getMedicalAuthorizedPatientDashboardData(
  supabase: MedicalTeamSupabaseClient,
  patientId: string,
  period: DashboardPeriod
): Promise<MedicalPatientDashboardResult> {
  const { data: latestData, error: latestError } = await supabase.rpc(
    "get_medical_authorized_patient_latest_records",
    { p_patient_id: patientId }
  );

  if (latestError) {
    return { status: "unavailable" };
  }

  const latestRows = normalizeMedicalDashboardRpcRows(latestData);

  if (latestRows === null) {
    return { status: "unavailable" };
  }

  // Zero rows means the database found no active authorization from this
  // patient to the caller, no persisted patient profile at that ID, or a
  // caller who no longer holds the medical role -- every case collapses
  // into the same safe inaccessible result (see
  // ../types/medical-patient-dashboard.ts).
  if (latestRows.length === 0) {
    return { status: "inaccessible" };
  }

  // The RPC's own `limit 3` should make this impossible. Never trust the
  // response shape blindly -- surface the safe unavailable state instead
  // of rendering more than the established recent-records limit.
  if (latestRows.length > MEDICAL_DASHBOARD_RECENT_RECORDS_LIMIT) {
    return { status: "unavailable" };
  }

  const latestResult = parseMedicalPatientLatestRecordsRows(latestRows);

  if (latestResult.status === "error") {
    return { status: "unavailable" };
  }

  const { patientName, records: recentRecords } = latestResult;

  if (recentRecords.length === 0) {
    return { status: "empty", patientName };
  }

  const { rangeStart, rangeEnd } = getHistoryPeriodRange(period);

  const { data: periodData, error: periodError } = await supabase.rpc(
    "get_medical_authorized_patient_period_records",
    {
      p_patient_id: patientId,
      p_range_start: rangeStart,
      p_range_end: rangeEnd,
    }
  );

  if (periodError) {
    return { status: "unavailable" };
  }

  const periodRows = normalizeMedicalDashboardRpcRows(periodData);

  if (periodRows === null) {
    return { status: "unavailable" };
  }

  const periodRecords = parseMedicalPatientPeriodRecordsRows(periodRows);

  if (periodRecords === null) {
    return { status: "unavailable" };
  }

  const periodMetrics = buildDashboardPeriodMetrics(periodRecords);
  const [latestRecord] = recentRecords;

  return {
    status: "ready",
    data: {
      patientName,
      latestPef: latestRecord.pefValue,
      latestRecordedAt: latestRecord.recordedAt,
      totalRecords: periodMetrics.totalRecords,
      daysWithSymptoms: periodMetrics.daysWithSymptoms,
      recordedAttacks: periodMetrics.recordedAttacks,
      rescueMedicationUsage: periodMetrics.rescueMedicationUsage,
      pefChartPoints: periodMetrics.pefChartPoints,
      recentRecords,
    },
  };
}
