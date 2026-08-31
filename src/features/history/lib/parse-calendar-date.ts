export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

/** Exact HTML date / ISO calendar date: YYYY-MM-DD. */
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const MS_PER_DAY = 86_400_000;

/**
 * Parses a strict YYYY-MM-DD calendar date.
 * Rejects timestamps, locale-formatted values, and impossible dates.
 */
export function parseCalendarDate(value: string): CalendarDate | null {
  const match = CALENDAR_DATE_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const resolved = new Date(Date.UTC(year, month - 1, day));

  if (
    resolved.getUTCFullYear() !== year ||
    resolved.getUTCMonth() !== month - 1 ||
    resolved.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function formatCalendarDate(date: CalendarDate): string {
  const year = String(date.year).padStart(4, "0");
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function compareCalendarDates(
  left: CalendarDate,
  right: CalendarDate
): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }

  if (left.month !== right.month) {
    return left.month - right.month;
  }

  return left.day - right.day;
}

/** Inclusive number of local calendar days from start through end. */
export function inclusiveCalendarDayCount(
  start: CalendarDate,
  end: CalendarDate
): number {
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);

  return Math.round((endUtc - startUtc) / MS_PER_DAY) + 1;
}
