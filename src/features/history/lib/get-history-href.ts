import {
  HISTORY_CUSTOM_PERIOD_PARAM,
  HISTORY_DEFAULT_PAGE,
  HISTORY_DELETED_NOTICE_PARAM,
  HISTORY_DELETED_NOTICE_VALUE,
  HISTORY_PAGE_PARAM,
  HISTORY_PATH,
} from "../constants";
import type { HistoryFilter } from "./parse-history-filter";

function appendHistoryPageParam(params: URLSearchParams, page: number): void {
  if (page > HISTORY_DEFAULT_PAGE) {
    params.set(HISTORY_PAGE_PARAM, String(page));
  }
}

/**
 * Builds an internal history list URL from an already parsed filter.
 * `pagina=1` is omitted so the first page stays canonical.
 * Never accepts an arbitrary return destination.
 */
export function getHistoryHref(
  filter: HistoryFilter,
  page: number = HISTORY_DEFAULT_PAGE
): string {
  if (filter.status === "fixed") {
    const params = new URLSearchParams();
    params.set("periodo", String(filter.period));
    appendHistoryPageParam(params, page);
    return `${HISTORY_PATH}?${params.toString()}`;
  }

  if (filter.status === "custom") {
    const params = new URLSearchParams();
    params.set("periodo", HISTORY_CUSTOM_PERIOD_PARAM);
    params.set("inicio", filter.startValue);
    params.set("fim", filter.endValue);
    appendHistoryPageParam(params, page);
    return `${HISTORY_PATH}?${params.toString()}`;
  }

  return HISTORY_PATH;
}

export function getDailyRecordDetailsHref(
  recordId: string,
  filter: HistoryFilter
): string {
  const historyHref = getHistoryHref(filter);
  const queryIndex = historyHref.indexOf("?");
  const query = queryIndex === -1 ? "" : historyHref.slice(queryIndex);

  return `${HISTORY_PATH}/${recordId}${query}`;
}

/** Canonical details URL without query parameters. */
export function getDailyRecordHref(recordId: string): string {
  return `${HISTORY_PATH}/${recordId}`;
}

export function getDailyRecordEditHref(recordId: string): string {
  return `${getDailyRecordHref(recordId)}/editar`;
}

/**
 * History URL for a confirmed deletion, preserving the validated filter
 * and attaching a fixed non-sensitive success indicator.
 */
export function getHistoryDeletedHref(filter: HistoryFilter): string {
  const historyHref = getHistoryHref(filter);
  const separator = historyHref.includes("?") ? "&" : "?";

  return `${historyHref}${separator}${HISTORY_DELETED_NOTICE_PARAM}=${HISTORY_DELETED_NOTICE_VALUE}`;
}
