import { HISTORY_TIME_ZONE } from "@/features/history/constants";
import {
  formatCalendarDate,
  type CalendarDate,
} from "@/features/history/lib/parse-calendar-date";

const reportLongDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

export type ReportFormattedDate = {
  isoDate: string;
  label: string;
};

/**
 * Formats an inclusive calendar date in pt-BR using the product timezone.
 * Uses midday UTC so the calendar day is stable in America/Maceio (UTC-3)
 * and never depends on the server operating-system timezone.
 */
export function formatReportCalendarDate(
  date: CalendarDate
): ReportFormattedDate {
  const instant = new Date(
    Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0)
  );

  return {
    isoDate: formatCalendarDate(date),
    label: reportLongDateFormatter.format(instant),
  };
}
