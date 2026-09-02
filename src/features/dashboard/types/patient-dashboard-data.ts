import type { DailyRecord } from "@/types/daily-record";

import type { PefChartPoint } from "./pef-chart-point";

/**
 * Real dashboard data for the verified authenticated patient (Issue 88).
 *
 * Period-scoped fields (`totalRecords`, `daysWithSymptoms`, `recordedAttacks`,
 * `rescueMedicationUsage`, `pefChartPoints`) reflect only the validated
 * selected dashboard period. `latestPef`, `latestRecordedAt` and
 * `recentRecords` always reflect the patient's latest records overall,
 * independent of the selected period.
 */
export type PatientDashboardData = {
  latestPef: number;
  latestRecordedAt: string;
  totalRecords: number;
  daysWithSymptoms: number;
  recordedAttacks: number;
  rescueMedicationUsage: number;
  pefChartPoints: readonly PefChartPoint[];
  recentRecords: readonly DailyRecord[];
};

/**
 * Discriminated outcome of loading the authenticated patient's dashboard data.
 *
 * - `ready`: at least one daily record exists overall; `data` is safe to render.
 * - `empty`: the overall latest/recent query succeeded and found zero records.
 * - `unavailable`: a required query failed; never implies zero records.
 */
export type DashboardDataResult =
  | { status: "ready"; data: PatientDashboardData }
  | { status: "empty" }
  | { status: "unavailable" };
