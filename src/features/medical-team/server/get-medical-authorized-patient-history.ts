import type { DashboardPeriod } from "@/features/dashboard/constants";
import { getHistoryPeriodRange } from "@/features/history/lib/get-history-period-range";
import { createClient } from "@/lib/supabase/server";

import { pageMedicalPatientHistoryRecords } from "../lib/page-medical-patient-history-records";
import {
  MEDICAL_DASHBOARD_RECENT_RECORDS_LIMIT,
  normalizeMedicalDashboardRpcRows,
  parseMedicalPatientLatestRecordsRows,
  parseMedicalPatientPeriodRecordsRows,
} from "../lib/map-medical-patient-dashboard-record-row";
import type { MedicalPatientHistoryResult } from "../types/medical-patient-history";

type MedicalTeamSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads one page of read-only history for one actively authorized patient
 * (Issue 111).
 *
 * Uses the existing Issue 110 RPCs only:
 * - `get_medical_authorized_patient_latest_records` resolves the display
 *   name and distinguishes inaccessible from an authorized patient with
 *   zero records. Zero rows is inaccessible. The empty sentinel is empty.
 * - `get_medical_authorized_patient_period_records` loads the selected
 *   period. Both functions derive the caller from `auth.uid()` and
 *   re-check an active authorization.
 *
 * The period function returns oldest-first. This loader reverses that
 * order so history is newest `recorded_at` first, then pages in memory
 * with the patient-history page size. No notes, record ids or patient ids
 * are selected. No writes. No raw errors. No logging of patient data.
 */
export async function getMedicalAuthorizedPatientHistory(
  supabase: MedicalTeamSupabaseClient,
  patientId: string,
  period: DashboardPeriod,
  page: number
): Promise<MedicalPatientHistoryResult> {
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

  if (latestRows.length === 0) {
    return { status: "inaccessible" };
  }

  if (latestRows.length > MEDICAL_DASHBOARD_RECENT_RECORDS_LIMIT) {
    return { status: "unavailable" };
  }

  const latestResult = parseMedicalPatientLatestRecordsRows(latestRows);

  if (latestResult.status === "error") {
    return { status: "unavailable" };
  }

  const { patientName, records: latestRecords } = latestResult;

  if (latestRecords.length === 0) {
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

  if (periodRecords.length === 0) {
    return { status: "filteredEmpty", patientName };
  }

  const newestFirst = [...periodRecords].reverse();
  const paged = pageMedicalPatientHistoryRecords(newestFirst, page);

  return {
    status: "ready",
    patientName,
    records: paged.records,
    totalCount: paged.totalCount,
    totalPages: paged.totalPages,
  };
}
