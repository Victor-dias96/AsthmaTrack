import { HISTORY_CUSTOM_RANGE_MAX_DAYS } from "../constants";
import {
  compareCalendarDates,
  inclusiveCalendarDayCount,
  parseCalendarDate,
  type CalendarDate,
} from "./parse-calendar-date";

export type CustomHistoryRangeValidation =
  | { ok: true; start: CalendarDate; end: CalendarDate }
  | {
      ok: false;
      formError?: string;
      inicioError?: string;
      fimError?: string;
      inicioInvalid?: boolean;
      fimInvalid?: boolean;
    };

/**
 * Validates a custom history range against strict calendar dates.
 * `today` must already be resolved in the product timezone.
 */
export function validateCustomHistoryRange(
  startValue: string,
  endValue: string,
  today: CalendarDate
): CustomHistoryRangeValidation {
  const hasStart = startValue.length > 0;
  const hasEnd = endValue.length > 0;

  if (!hasStart && !hasEnd) {
    return {
      ok: false,
      formError: "Informe a data inicial e a data final.",
      inicioInvalid: true,
      fimInvalid: true,
    };
  }

  if (!hasStart) {
    return {
      ok: false,
      inicioError: "Informe a data inicial.",
    };
  }

  if (!hasEnd) {
    return {
      ok: false,
      fimError: "Informe a data final.",
    };
  }

  const start = parseCalendarDate(startValue);
  const end = parseCalendarDate(endValue);
  let inicioError: string | undefined;
  let fimError: string | undefined;

  if (!start) {
    inicioError = "Informe uma data inicial válida.";
  }

  if (!end) {
    fimError = "Informe uma data final válida.";
  }

  if (!start || !end) {
    return { ok: false, inicioError, fimError };
  }

  if (compareCalendarDates(start, end) > 0) {
    return {
      ok: false,
      formError: "A data inicial não pode ser posterior à data final.",
      inicioInvalid: true,
      fimInvalid: true,
    };
  }

  if (compareCalendarDates(start, today) > 0) {
    inicioError = "A data inicial não pode ser no futuro.";
  }

  if (compareCalendarDates(end, today) > 0) {
    fimError = "A data final não pode ser no futuro.";
  }

  if (inicioError || fimError) {
    return { ok: false, inicioError, fimError };
  }

  if (inclusiveCalendarDayCount(start, end) > HISTORY_CUSTOM_RANGE_MAX_DAYS) {
    return {
      ok: false,
      formError: "O período personalizado deve ter no máximo 366 dias.",
    };
  }

  return { ok: true, start, end };
}
