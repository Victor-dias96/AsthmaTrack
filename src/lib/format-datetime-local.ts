/** Matches HTML datetime-local values: YYYY-MM-DDTHH:mm or with seconds. */
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

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
): ZonedDateTimeParts | null {
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
    return null;
  }

  return { year, month, day, hour, minute, second };
}

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number | null {
  const parts = getZonedDateTimeParts(instant, timeZone);

  if (!parts) {
    return null;
  }

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

/** Formats a Date as an HTML datetime-local value (YYYY-MM-DDTHH:mm) in local time. */
export function formatDateToDatetimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts an ISO timestamptz into a datetime-local value in `timeZone`.
 * Uses the named zone only — never UTC string slicing or the browser zone.
 */
export function formatIsoToDatetimeLocal(
  isoTimestamp: string,
  timeZone: string
): string | null {
  const instant = new Date(isoTimestamp);

  if (Number.isNaN(instant.getTime())) {
    return null;
  }

  const parts = getZonedDateTimeParts(instant, timeZone);

  if (!parts) {
    return null;
  }

  return `${parts.year}-${padTwoDigits(parts.month)}-${padTwoDigits(
    parts.day
  )}T${padTwoDigits(parts.hour)}:${padTwoDigits(parts.minute)}`;
}

/**
 * Converts a datetime-local string into an ISO timestamptz interpreted in
 * `timeZone`. Does not append a fake `Z` suffix or use `new Date(string)`.
 */
export function convertDatetimeLocalInTimeZoneToIso(
  localValue: string,
  timeZone: string
): string | null {
  const match = DATETIME_LOCAL_PATTERN.exec(localValue);

  if (!match) {
    return null;
  }

  const year = Number(localValue.slice(0, 4));
  const month = Number(localValue.slice(5, 7));
  const day = Number(localValue.slice(8, 10));
  const hour = Number(localValue.slice(11, 13));
  const minute = Number(localValue.slice(14, 16));
  const second = match[1] ? Number(localValue.slice(17, 19)) : 0;

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, 0);

  if (Number.isNaN(utcGuess)) {
    return null;
  }

  const guessInstant = new Date(utcGuess);
  const offset = getTimeZoneOffsetMs(guessInstant, timeZone);

  if (offset === null) {
    return null;
  }

  const adjustedMs = utcGuess - offset;
  const adjustedInstant = new Date(adjustedMs);
  const confirmedOffset = getTimeZoneOffsetMs(adjustedInstant, timeZone);

  if (confirmedOffset === null) {
    return null;
  }

  const utcMs =
    offset === confirmedOffset ? adjustedMs : utcGuess - confirmedOffset;
  const result = new Date(utcMs);

  if (Number.isNaN(result.getTime())) {
    return null;
  }

  const parts = getZonedDateTimeParts(result, timeZone);

  if (
    !parts ||
    parts.year !== year ||
    parts.month !== month ||
    parts.day !== day ||
    parts.hour !== hour ||
    parts.minute !== minute ||
    parts.second !== second
  ) {
    return null;
  }

  return result.toISOString();
}
