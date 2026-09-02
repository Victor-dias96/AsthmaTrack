import type { CalendarDate } from "@/features/history/lib/parse-calendar-date";

import type { ReportPeriod } from "../constants";
import type { PatientReportRecord } from "../lib/map-patient-report-record-row";

/**
 * Bounded report data for the verified authenticated patient (Issue 90).
 * `records` is mapped and retained for later report sections; Issue 90
 * displays only the period label, inclusive dates and record count.
 */
export type PatientReportData = {
  period: ReportPeriod;
  displayStart: CalendarDate;
  displayEnd: CalendarDate;
  recordCount: number;
  records: readonly PatientReportRecord[];
};

/**
 * Discriminated outcome of loading the authenticated patient's report data.
 *
 * - `ready`: the period query succeeded and at least one row mapped.
 * - `empty`: the period query succeeded with zero rows.
 * - `unavailable`: the query failed, or every returned row failed to map.
 */
export type PatientReportDataResult =
  | { status: "ready"; data: PatientReportData }
  | { status: "empty" }
  | { status: "unavailable" };
