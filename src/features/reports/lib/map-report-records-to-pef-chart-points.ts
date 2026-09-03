import type { PefChartPoint } from "@/features/daily-records/types/pef-chart-point";

import {
  getValidReportRecordedAtMs,
  isValidReportPefValue,
} from "./is-valid-report-pef-measurement";
import type { PatientReportRecord } from "./map-patient-report-record-row";

type ValidatedReportPefChartPoint = {
  recordedAt: string;
  pefValue: number;
  recordedAtMs: number;
  inputIndex: number;
};

function compareValidatedReportPefPoints(
  left: ValidatedReportPefChartPoint,
  right: ValidatedReportPefChartPoint
): number {
  if (left.recordedAtMs !== right.recordedAtMs) {
    return left.recordedAtMs - right.recordedAtMs;
  }

  return left.inputIndex - right.inputIndex;
}

/**
 * Maps already-authorized selected-period report records into PEF chart
 * points. Excludes invalid timestamps and non-positive-integer PEF values
 * without mutating the input. Chronological order uses numeric timestamps
 * and preserves equal timestamps in stable input order.
 */
export function mapReportRecordsToPefChartPoints(
  records: readonly PatientReportRecord[]
): readonly PefChartPoint[] {
  const validatedPoints: ValidatedReportPefChartPoint[] = [];

  for (let inputIndex = 0; inputIndex < records.length; inputIndex += 1) {
    const record = records[inputIndex];

    if (!isValidReportPefValue(record.pefValue)) {
      continue;
    }

    const recordedAtMs = getValidReportRecordedAtMs(record.recordedAt);

    if (recordedAtMs === null) {
      continue;
    }

    validatedPoints.push({
      recordedAt: record.recordedAt,
      pefValue: record.pefValue,
      recordedAtMs,
      inputIndex,
    });
  }

  return validatedPoints
    .slice()
    .sort(compareValidatedReportPefPoints)
    .map((point) => ({
      recordedAt: point.recordedAt,
      pefValue: point.pefValue,
    }));
}
