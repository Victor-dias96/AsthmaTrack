import { createClient } from "@/lib/supabase/server";

import { REPORT_INFORMATIONAL_NOTICE_BODY, REPORT_PERIOD_LABELS } from "../constants";
import { calculatePefSummary } from "../lib/calculate-pef-summary";
import { calculateRecordedAttacksSummary } from "../lib/calculate-recorded-attacks-summary";
import { calculateSymptomFrequencySummary } from "../lib/calculate-symptom-frequency-summary";
import { formatReportPatientName } from "../lib/format-report-patient-name";
import {
  formatReportCalendarDate,
  formatReportGeneratedAt,
  isUsableReportCalendarDate,
} from "../lib/format-report-period-dates";
import { mapReportRecordsToPefChartPoints } from "../lib/map-report-records-to-pef-chart-points";
import type { ReportPeriod } from "../constants";
import type { PatientReportDataResult } from "../types/patient-report-data";
import type { PatientReportPdfResult } from "../types/patient-report-pdf-data";
import { getPatientReportData } from "./get-patient-report-data";
import { getPatientReportProfile } from "./get-patient-report-profile";

type ReportSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Same displayed-range resolution as the browser report page: `ready`
 * carries its own display dates, `empty` returns them directly. Never
 * called for `unavailable`.
 */
function getVisibleReportDates(
  result: Exclude<PatientReportDataResult, { status: "unavailable" }>
) {
  if (result.status === "ready") {
    return {
      displayStart: result.data.displayStart,
      displayEnd: result.data.displayEnd,
    };
  }

  return {
    displayStart: result.displayStart,
    displayEnd: result.displayEnd,
  };
}

/**
 * Builds the narrow, typed and privacy-reviewed PDF report model for the
 * already-verified authenticated patient (Issue 98).
 *
 * Single source of report truth shared with the browser report page: reuses
 * the same Issue 90 data loader, the same profile loader, and the exact same
 * PEF/symptom/attack calculation and chart-mapping helpers so the PDF can
 * never diverge from the browser report for the same period and instant.
 *
 * - Performs authentication nowhere in this function; the caller must pass
 *   an already-verified `patientId`.
 * - Never accepts a patientId from anything other than a verified session.
 * - Recalculates every metric server-side; never trusts a browser-supplied
 *   value.
 * - Returns `unavailable` (no document) for a failed query, an unformattable
 *   `now`, or an unusable display date — never a fabricated or partial PDF.
 */
export async function getPatientReportPdfData(
  supabase: ReportSupabaseClient,
  patientId: string,
  period: ReportPeriod,
  now: Date = new Date()
): Promise<PatientReportPdfResult> {
  const generated = formatReportGeneratedAt(now);

  if (generated === null) {
    return { status: "unavailable" };
  }

  const [profileResult, reportResult] = await Promise.all([
    getPatientReportProfile(supabase, patientId),
    getPatientReportData(supabase, patientId, period, now),
  ]);

  if (
    profileResult.status === "unavailable" ||
    reportResult.status === "unavailable"
  ) {
    return { status: "unavailable" };
  }

  const { displayStart, displayEnd } = getVisibleReportDates(reportResult);

  if (
    !isUsableReportCalendarDate(displayStart) ||
    !isUsableReportCalendarDate(displayEnd)
  ) {
    return { status: "unavailable" };
  }

  const patientName = formatReportPatientName(profileResult.fullName);
  const periodLabel = REPORT_PERIOD_LABELS[period];
  const periodStart = formatReportCalendarDate(displayStart).label;
  const periodEnd = formatReportCalendarDate(displayEnd).label;

  if (reportResult.status === "empty") {
    return {
      status: "ready",
      data: {
        patientName,
        periodLabel,
        periodStart,
        periodEnd,
        generatedAt: generated.label,
        recordCount: 0,
        pefSummary: null,
        symptomSummary: null,
        attacksSummary: null,
        chartPoints: [],
        informationalNotice: REPORT_INFORMATIONAL_NOTICE_BODY,
      },
    };
  }

  const { records, recordCount } = reportResult.data;

  return {
    status: "ready",
    data: {
      patientName,
      periodLabel,
      periodStart,
      periodEnd,
      generatedAt: generated.label,
      recordCount,
      pefSummary: calculatePefSummary(records),
      symptomSummary: calculateSymptomFrequencySummary(records),
      attacksSummary: calculateRecordedAttacksSummary(records),
      chartPoints: mapReportRecordsToPefChartPoints(records),
      informationalNotice: REPORT_INFORMATIONAL_NOTICE_BODY,
    },
  };
}
