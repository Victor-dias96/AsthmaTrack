import type { DailyRecord, SymptomSeverity } from "@/types/daily-record";

import { RECENT_RECORDS_DISPLAY_LIMIT } from "../constants";
import { isDisplayablePefValue } from "./is-displayable-pef-value";
import { parseLatestRecordRecordedAt } from "./format-latest-record-date";

function isValidSymptomSeverity(value: number): value is SymptomSeverity {
  return Number.isInteger(value) && value >= 0 && value <= 3;
}

function isDisplayableRecentRecord(record: DailyRecord): boolean {
  if (parseLatestRecordRecordedAt(record.recordedAt) === null) {
    return false;
  }

  if (!isDisplayablePefValue(record.pefValue)) {
    return false;
  }

  return (
    isValidSymptomSeverity(record.coughSeverity) &&
    isValidSymptomSeverity(record.wheezingSeverity) &&
    isValidSymptomSeverity(record.shortnessOfBreathSeverity) &&
    isValidSymptomSeverity(record.chestTightnessSeverity)
  );
}

/**
 * Selects up to RECENT_RECORDS_DISPLAY_LIMIT records for dashboard display.
 * Defensively orders by recordedAt descending without mutating the input array.
 * Issue 88 should supply records already ordered and limited; this remains a
 * safe presentation fallback.
 */
export function selectRecentRecordsForDisplay(
  records: readonly DailyRecord[]
): DailyRecord[] {
  return [...records]
    .filter(isDisplayableRecentRecord)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
    .slice(0, RECENT_RECORDS_DISPLAY_LIMIT);
}
