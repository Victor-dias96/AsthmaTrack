import { isDisplayablePefValue } from "./is-displayable-pef-value";
import type { PefChartPoint } from "../types/pef-chart-point";

const ISO_TIMESTAMP_PREFIX = /^\d{4}-\d{2}-\d{2}T/;

export type PefChartDatum = {
  recordedAt: string;
  pefValue: number;
  chartKey: string;
  recordedTimestamp: number;
};

export type PefChartPresentation =
  | { status: "empty" }
  | { status: "unavailable" }
  | { status: "ready"; points: readonly PefChartDatum[] };

type ValidatedPefChartPoint = {
  recordedAt: string;
  pefValue: number;
  recordedAtMs: number;
  inputIndex: number;
};

/**
 * Accepts ISO-compatible timestamps only. Chronological order uses the
 * parsed instant, never locale strings or the browser timezone.
 */
function getValidRecordedAtMs(recordedAt: string): number | null {
  if (
    typeof recordedAt !== "string" ||
    !ISO_TIMESTAMP_PREFIX.test(recordedAt)
  ) {
    return null;
  }

  const recordedAtMs = new Date(recordedAt).getTime();

  if (!Number.isFinite(recordedAtMs)) {
    return null;
  }

  return recordedAtMs;
}

function isValidChartPefValue(pefValue: number): boolean {
  return typeof pefValue === "number" && isDisplayablePefValue(pefValue);
}

function compareValidatedPoints(
  left: ValidatedPefChartPoint,
  right: ValidatedPefChartPoint
): number {
  if (left.recordedAtMs !== right.recordedAtMs) {
    return left.recordedAtMs - right.recordedAtMs;
  }

  return left.inputIndex - right.inputIndex;
}

/**
 * Defensive presentation normalization for the PEF chart.
 * Does not mutate the input array or its objects.
 */
export function normalizePefChartPoints(
  data: readonly PefChartPoint[]
): PefChartPresentation {
  if (data.length === 0) {
    return { status: "empty" };
  }

  const validatedPoints: ValidatedPefChartPoint[] = [];

  for (let inputIndex = 0; inputIndex < data.length; inputIndex += 1) {
    const point = data[inputIndex];
    const recordedAtMs = getValidRecordedAtMs(point.recordedAt);

    if (recordedAtMs === null || !isValidChartPefValue(point.pefValue)) {
      continue;
    }

    validatedPoints.push({
      recordedAt: point.recordedAt,
      pefValue: point.pefValue,
      recordedAtMs,
      inputIndex,
    });
  }

  if (validatedPoints.length === 0) {
    return { status: "unavailable" };
  }

  const orderedPoints = validatedPoints.slice().sort(compareValidatedPoints);

  return {
    status: "ready",
    points: orderedPoints.map((point) => ({
      recordedAt: point.recordedAt,
      pefValue: point.pefValue,
      chartKey: `pef-${point.inputIndex}`,
      recordedTimestamp: point.recordedAtMs,
    })),
  };
}
