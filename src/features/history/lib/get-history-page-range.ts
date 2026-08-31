import { HISTORY_PAGE_SIZE } from "../constants";

export type HistoryPageRange = {
  from: number;
  to: number;
};

/**
 * Inclusive, zero-based Supabase `range` bounds for a 1-based page.
 * Page 1 is `range(0, 9)` when the page size is 10.
 */
export function getHistoryPageRange(page: number): HistoryPageRange {
  const from = (page - 1) * HISTORY_PAGE_SIZE;
  const to = from + HISTORY_PAGE_SIZE - 1;

  return { from, to };
}

export function getHistoryTotalPages(totalCount: number): number {
  return Math.ceil(totalCount / HISTORY_PAGE_SIZE);
}
