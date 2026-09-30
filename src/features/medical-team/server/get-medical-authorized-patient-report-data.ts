import type { ReportPeriod } from "@/features/reports/constants";
import {
  formatReportGeneratedAt,
  isUsableReportCalendarDate,
} from "@/features/reports/lib/format-report-period-dates";
import { getReportPeriodRange } from "@/features/reports/lib/get-report-period-range";
import { createClient } from "@/lib/supabase/server";

import { buildMedicalPatientReportSummaries } from "../lib/build-medical-patient-report-summaries";
import {
  MEDICAL_DASHBOARD_RECENT_RECORDS_LIMIT,
  normalizeMedicalDashboardRpcRows,
  parseMedicalPatientLatestRecordsRows,
  parseMedicalPatientPeriodRecordsRows,
} from "../lib/map-medical-patient-dashboard-record-row";
import type {
  MedicalPatientReportContext,
  MedicalPatientReportResult,
} from "../types/medical-patient-report";

type MedicalTeamSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads one read-only report for one actively authorized patient (Issue 112).
 *
 * Uses the existing Issue 110 RPCs only:
 * - `get_medical_authorized_patient_latest_records` resolves the display
 *   name and distinguishes inaccessible from an authorized patient.
 *   Zero rows is inaccessible. The empty sentinel is an authorized patient
 *   with zero records.
 * - `get_medical_authorized_patient_period_records` loads the selected
 *   report period. Both functions derive the caller from `auth.uid()` and
 *   re-check an active authorization and the persisted medical role.
 *
 * The period bounds come from the patient report's range helper
 * (America/Maceio, inclusive local start, exclusive next local day,
 * filtered on `recorded_at`). Summaries reuse the patient report
 * calculations. No notes, email, record ids or new database function.
 * No writes. No raw errors. No logging of patient data.
 */
export async function getMedicalAuthorizedPatientReportData(
  supabase: MedicalTeamSupabaseClient,
  patientId: string,
  period: ReportPeriod,
  now: Date = new Date()
): Promise<MedicalPatientReportResult> {
  const generated = formatReportGeneratedAt(now);

  if (generated === null) {
    return { status: "unavailable" };
  }

  const { rangeStart, rangeEnd, displayStart, displayEnd } =
    getReportPeriodRange(period, now);

  if (
    !isUsableReportCalendarDate(displayStart) ||
    !isUsableReportCalendarDate(displayEnd)
  ) {
    return { status: "unavailable" };
  }

  const contextBase = {
    period,
    displayStart,
    displayEnd,
    generatedAtIso: generated.iso,
    generatedAtLabel: generated.label,
  };

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
  const context: MedicalPatientReportContext = {
    ...contextBase,
    patientName,
  };

  if (latestRecords.length === 0) {
    return { status: "empty", ...context };
  }

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
    return { status: "empty", ...context };
  }

  return {
    status: "ready",
    data: {
      ...context,
      ...buildMedicalPatientReportSummaries(periodRecords),
    },
  };
}
