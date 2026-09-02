import { getHistoryCalendarDate } from "@/features/history";
import { formatCalendarDate } from "@/features/history/lib/parse-calendar-date";

import type { PefChartPoint } from "../types/pef-chart-point";
import { parseLatestRecordRecordedAt } from "./format-latest-record-date";
import { isDisplayablePefValue } from "./is-displayable-pef-value";
import type { DashboardPeriodRecord } from "./map-dashboard-period-record-row";

export type DashboardPeriodMetrics = {
  totalRecords: number;
  daysWithSymptoms: number;
  recordedAttacks: number;
  rescueMedicationUsage: number;
  pefChartPoints: readonly PefChartPoint[];
};

function hasAnySymptom(record: DashboardPeriodRecord): boolean {
  return (
    record.coughSeverity > 0 ||
    record.wheezingSeverity > 0 ||
    record.shortnessOfBreathSeverity > 0 ||
    record.chestTightnessSeverity > 0
  );
}

/**
 * Counts distinct local calendar days (product timezone) containing at
 * least one symptomatic record. Multiple symptomatic records on the same
 * day count once; a record with every severity at 0 does not count.
 */
function countDaysWithSymptoms(
  records: readonly DashboardPeriodRecord[]
): number {
  const symptomaticDayKeys = new Set<string>();

  for (const record of records) {
    if (!hasAnySymptom(record)) {
      continue;
    }

    const parsedDate = parseLatestRecordRecordedAt(record.recordedAt);

    if (parsedDate === null) {
      continue;
    }

    symptomaticDayKeys.add(
      formatCalendarDate(getHistoryCalendarDate(parsedDate))
    );
  }

  return symptomaticDayKeys.size;
}

/**
 * Maps validated period records into PEF chart points.
 *
 * Records are expected to already be in chronological (ascending) order from
 * the database query, so no re-sorting is performed here. Only PEF
 * displayability is re-checked; a non-displayable PEF excludes that point
 * from the chart without affecting other period metrics.
 */
function buildPefChartPoints(
  records: readonly DashboardPeriodRecord[]
): readonly PefChartPoint[] {
  const points: PefChartPoint[] = [];

  for (const record of records) {
    if (!isDisplayablePefValue(record.pefValue)) {
      continue;
    }

    points.push({ recordedAt: record.recordedAt, pefValue: record.pefValue });
  }

  return points;
}

/**
 * Builds every period-scoped dashboard metric and the chart series from one
 * already-validated set of period records.
 *
 * Pure and deterministic: performs no Supabase access, no authentication, no
 * rendering, no navigation and no medical interpretation. Does not mutate
 * the input array.
 */
export function buildDashboardPeriodMetrics(
  records: readonly DashboardPeriodRecord[]
): DashboardPeriodMetrics {
  return {
    totalRecords: records.length,
    daysWithSymptoms: countDaysWithSymptoms(records),
    recordedAttacks: records.filter((record) => record.hadAttack).length,
    rescueMedicationUsage: records.filter(
      (record) => record.usedRescueMedication
    ).length,
    pefChartPoints: buildPefChartPoints(records),
  };
}
