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

const reportGeneratedTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: HISTORY_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export type ReportFormattedDate = {
  isoDate: string;
  label: string;
};

export type ReportFormattedInstant = {
  iso: string;
  label: string;
};

/**
 * True when the calendar date can be formatted without producing an
 * impossible civil date. Does not substitute today's date.
 */
export function isUsableReportCalendarDate(date: CalendarDate): boolean {
  if (
    !Number.isInteger(date.year) ||
    !Number.isInteger(date.month) ||
    !Number.isInteger(date.day)
  ) {
    return false;
  }

  const resolved = new Date(Date.UTC(date.year, date.month - 1, date.day));

  return (
    resolved.getUTCFullYear() === date.year &&
    resolved.getUTCMonth() === date.month - 1 &&
    resolved.getUTCDate() === date.day
  );
}

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

/**
 * Formats one server-generated report instant in pt-BR using the product
 * timezone. Returns null for an invalid Date instead of substituting now.
 */
export function formatReportGeneratedAt(
  instant: Date
): ReportFormattedInstant | null {
  if (Number.isNaN(instant.getTime())) {
    return null;
  }

  const dateLabel = reportLongDateFormatter.format(instant);
  const timeLabel = reportGeneratedTimeFormatter.format(instant);

  if (
    dateLabel.length === 0 ||
    timeLabel.length === 0 ||
    dateLabel.toLowerCase().includes("invalid") ||
    timeLabel.toLowerCase().includes("invalid")
  ) {
    return null;
  }

  return {
    iso: instant.toISOString(),
    label: `${dateLabel}, ${timeLabel}`,
  };
}
