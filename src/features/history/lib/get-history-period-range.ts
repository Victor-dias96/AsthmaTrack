import {
  HISTORY_TIME_ZONE,
  type HistoryFixedPeriod,
} from "../constants";
import type { CalendarDate } from "./parse-calendar-date";

type ZonedDateTimeParts = CalendarDate & {
  hour: number;
  minute: number;
  second: number;
};

function readFormatPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): number | null {
  const part = parts.find((entry) => entry.type === type);

  if (!part) {
    return null;
  }

  const value = Number(part.value);

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function getZonedDateTimeParts(
  instant: Date,
  timeZone: string
): ZonedDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(instant);
  const year = readFormatPart(parts, "year");
  const month = readFormatPart(parts, "month");
  const day = readFormatPart(parts, "day");
  const hour = readFormatPart(parts, "hour");
  const minute = readFormatPart(parts, "minute");
  const second = readFormatPart(parts, "second");

  if (
    year === null ||
    month === null ||
    day === null ||
    hour === null ||
    minute === null ||
    second === null
  ) {
    throw new Error("Unable to resolve the history period timezone.");
  }

  return { year, month, day, hour, minute, second };
}

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = getZonedDateTimeParts(instant, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return asUtc - instant.getTime();
}

function zonedStartOfDayToIso(date: CalendarDate, timeZone: string): string {
  const utcGuess = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0, 0);
  const guessInstant = new Date(utcGuess);
  const offset = getTimeZoneOffsetMs(guessInstant, timeZone);
  const adjustedMs = utcGuess - offset;
  const adjustedInstant = new Date(adjustedMs);
  const confirmedOffset = getTimeZoneOffsetMs(adjustedInstant, timeZone);
  const utcMs =
    offset === confirmedOffset ? adjustedMs : utcGuess - confirmedOffset;

  return new Date(utcMs).toISOString();
}

function calendarDateFromUtcDay(utcDay: number): CalendarDate {
  const instant = new Date(utcDay);

  return {
    year: instant.getUTCFullYear(),
    month: instant.getUTCMonth() + 1,
    day: instant.getUTCDate(),
  };
}

export type HistoryPeriodRange = {
  rangeStart: string;
  rangeEnd: string;
};

/**
 * Inclusive start and exclusive end of a fixed local calendar period.
 * `period` 7 is today plus the previous 6 days; 30 is today plus the
 * previous 29 days; 90 is today plus the previous 89 days — all in
 * HISTORY_TIME_ZONE.
 */
export function getHistoryPeriodRange(
  period: HistoryFixedPeriod,
  now: Date = new Date()
): HistoryPeriodRange {
  const today = getHistoryCalendarDate(now);
  const startDate = calendarDateFromUtcDay(
    Date.UTC(today.year, today.month - 1, today.day - (period - 1))
  );
  const endDate = calendarDateFromUtcDay(
    Date.UTC(today.year, today.month - 1, today.day + 1)
  );

  return {
    rangeStart: zonedStartOfDayToIso(startDate, HISTORY_TIME_ZONE),
    rangeEnd: zonedStartOfDayToIso(endDate, HISTORY_TIME_ZONE),
  };
}

/** Today's calendar date in HISTORY_TIME_ZONE. */
export function getHistoryCalendarDate(instant: Date): CalendarDate {
  const parts = getZonedDateTimeParts(instant, HISTORY_TIME_ZONE);

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
}

/**
 * Inclusive local calendar start through inclusive local calendar end,
 * converted to [start-of-start, start-of-day-after-end) ISO instants
 * in HISTORY_TIME_ZONE.
 */
export function getCustomHistoryPeriodRange(
  start: CalendarDate,
  end: CalendarDate
): HistoryPeriodRange {
  const exclusiveEnd = calendarDateFromUtcDay(
    Date.UTC(end.year, end.month - 1, end.day + 1)
  );

  return {
    rangeStart: zonedStartOfDayToIso(start, HISTORY_TIME_ZONE),
    rangeEnd: zonedStartOfDayToIso(exclusiveEnd, HISTORY_TIME_ZONE),
  };
}
