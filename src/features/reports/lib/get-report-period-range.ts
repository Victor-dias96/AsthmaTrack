import {
  getHistoryCalendarDate,
  getHistoryPeriodRange,
} from "@/features/history";
import type { CalendarDate } from "@/features/history/lib/parse-calendar-date";

import type { ReportPeriod } from "../constants";

export type ReportPeriodRange = {
  rangeStart: string;
  rangeEnd: string;
  displayStart: CalendarDate;
  displayEnd: CalendarDate;
};

/**
 * Inclusive local start and exclusive local end for a report period, plus
 * the inclusive calendar dates shown in the summary.
 *
 * Reuses the established history range helper (America/Maceio, start of
 * first included local day through start of the next local day). Does not
 * mutate the `now` Date.
 */
export function getReportPeriodRange(
  period: ReportPeriod,
  now: Date = new Date()
): ReportPeriodRange {
  const { rangeStart, rangeEnd } = getHistoryPeriodRange(period, now);

  return {
    rangeStart,
    rangeEnd,
    displayStart: getHistoryCalendarDate(new Date(rangeStart)),
    displayEnd: getHistoryCalendarDate(now),
  };
}
