import {
  HISTORY_CUSTOM_PERIOD,
  HISTORY_CUSTOM_PERIOD_PARAM,
  type HistoryFixedPeriod,
} from "../constants";
import { validateCustomHistoryRange } from "./validate-custom-history-range";
import type { CalendarDate } from "./parse-calendar-date";
import { parseHistoryPeriod } from "./parse-history-period";

export type HistoryFilterCustomErrors = {
  formError?: string;
  inicioError?: string;
  fimError?: string;
  inicioInvalid?: boolean;
  fimInvalid?: boolean;
};

export type HistoryFilter =
  | { status: "fixed"; period: HistoryFixedPeriod }
  | {
      status: "custom";
      period: typeof HISTORY_CUSTOM_PERIOD;
      start: CalendarDate;
      end: CalendarDate;
      startValue: string;
      endValue: string;
    }
  | {
      status: "custom-pending";
      period: typeof HISTORY_CUSTOM_PERIOD;
      startValue: string;
      endValue: string;
    }
  | {
      status: "custom-invalid";
      period: typeof HISTORY_CUSTOM_PERIOD;
      startValue: string;
      endValue: string;
      errors: HistoryFilterCustomErrors;
    };

type SearchParamValue = string | string[] | undefined;

type SingleSearchParam =
  | { kind: "missing" }
  | { kind: "repeated" }
  | { kind: "value"; value: string };

function readSingleSearchParam(value: SearchParamValue): SingleSearchParam {
  if (value === undefined) {
    return { kind: "missing" };
  }

  if (Array.isArray(value)) {
    return { kind: "repeated" };
  }

  return { kind: "value", value };
}

function isExplicitCustomPeriod(value: SearchParamValue): boolean {
  return typeof value === "string" && value === HISTORY_CUSTOM_PERIOD_PARAM;
}

/**
 * Resolves history search params to a fixed period or a custom range.
 * `periodo=personalizado` is accepted only as a single value; invalid
 * custom dates never fall back to 7 days.
 */
export function parseHistoryFilter(
  params: Record<string, string | string[] | undefined>,
  today: CalendarDate
): HistoryFilter {
  if (!isExplicitCustomPeriod(params.periodo)) {
    return {
      status: "fixed",
      period: parseHistoryPeriod(params.periodo),
    };
  }

  const inicioParam = readSingleSearchParam(params.inicio);
  const fimParam = readSingleSearchParam(params.fim);

  if (inicioParam.kind === "repeated" || fimParam.kind === "repeated") {
    return {
      status: "custom-invalid",
      period: HISTORY_CUSTOM_PERIOD,
      startValue: "",
      endValue: "",
      errors: { formError: "Informe um período válido." },
    };
  }

  const startValue = inicioParam.kind === "value" ? inicioParam.value : "";
  const endValue = fimParam.kind === "value" ? fimParam.value : "";

  if (inicioParam.kind === "missing" && fimParam.kind === "missing") {
    return {
      status: "custom-pending",
      period: HISTORY_CUSTOM_PERIOD,
      startValue: "",
      endValue: "",
    };
  }

  const validation = validateCustomHistoryRange(startValue, endValue, today);

  if (!validation.ok) {
    return {
      status: "custom-invalid",
      period: HISTORY_CUSTOM_PERIOD,
      startValue,
      endValue,
      errors: {
        formError: validation.formError,
        inicioError: validation.inicioError,
        fimError: validation.fimError,
        inicioInvalid: validation.inicioInvalid,
        fimInvalid: validation.fimInvalid,
      },
    };
  }

  return {
    status: "custom",
    period: HISTORY_CUSTOM_PERIOD,
    start: validation.start,
    end: validation.end,
    startValue,
    endValue,
  };
}
