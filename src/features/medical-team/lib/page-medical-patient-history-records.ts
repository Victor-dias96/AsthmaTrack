import {
  getHistoryPageRange,
  getHistoryTotalPages,
} from "@/features/history/lib/get-history-page-range";

import type { MedicalPatientHistoryRecord } from "../types/medical-patient-history";

export type PagedMedicalPatientHistory = {
  records: readonly MedicalPatientHistoryRecord[];
  totalCount: number;
  totalPages: number;
};

/**
 * Pages an already-descending history list with the patient-history page
 * size. The period RPC returns every in-range row oldest-first; callers
 * reverse that array before paging so the visible order is `recorded_at`
 * descending. Does not query or authorize.
 */
export function pageMedicalPatientHistoryRecords(
  recordsNewestFirst: readonly MedicalPatientHistoryRecord[],
  page: number
): PagedMedicalPatientHistory {
  const totalCount = recordsNewestFirst.length;
  const totalPages = getHistoryTotalPages(totalCount);
  const { from, to } = getHistoryPageRange(page);

  return {
    records: recordsNewestFirst.slice(from, to + 1),
    totalCount,
    totalPages,
  };
}
