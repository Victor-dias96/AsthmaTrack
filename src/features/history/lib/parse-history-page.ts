import { HISTORY_DEFAULT_PAGE } from "../constants";
import { getHistoryPageRange } from "./get-history-page-range";

const CANONICAL_PAGE_PATTERN = /^[1-9][0-9]*$/;

/**
 * Resolves the history `pagina` search param to a 1-based page number.
 * Missing, repeated, malformed, unsafe, and non-canonical values fall
 * back to 1 without throwing.
 */
export function parseHistoryPage(value: string | string[] | undefined): number {
  if (typeof value !== "string") {
    return HISTORY_DEFAULT_PAGE;
  }

  if (!CANONICAL_PAGE_PATTERN.test(value)) {
    return HISTORY_DEFAULT_PAGE;
  }

  const page = Number(value);

  if (!Number.isSafeInteger(page) || page < 1) {
    return HISTORY_DEFAULT_PAGE;
  }

  const { from, to } = getHistoryPageRange(page);

  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0) {
    return HISTORY_DEFAULT_PAGE;
  }

  return page;
}
