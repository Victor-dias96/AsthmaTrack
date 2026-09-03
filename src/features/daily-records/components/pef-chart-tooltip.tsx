import type { TooltipContentProps } from "recharts";

import { formatPefChartDateTimeFromIso } from "../lib/format-pef-chart-datetime";
import { isDisplayablePefValue } from "../lib/is-displayable-pef-value";

export type PefChartTooltipProps = Pick<
  TooltipContentProps<number, string>,
  "active" | "payload"
>;

type ValidTooltipPoint = {
  recordedAt: string;
  pefValue: number;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTooltipRecordedAt(isoTimestamp: string): Date | null {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Defensive presentation boundary for the active Recharts payload.
 * Does not replace chart-point normalization and does not mutate payload.
 */
function readActivePefPoint(
  payload: PefChartTooltipProps["payload"]
): ValidTooltipPoint | null {
  if (payload.length === 0) {
    return null;
  }

  const entry = payload[0];

  if (entry === undefined) {
    return null;
  }

  const source: unknown = entry.payload;

  if (!isPlainRecord(source)) {
    return null;
  }

  const recordedAt = source.recordedAt;
  const pefValue = source.pefValue;

  if (typeof recordedAt !== "string" || typeof pefValue !== "number") {
    return null;
  }

  if (!Number.isFinite(pefValue) || !isDisplayablePefValue(pefValue)) {
    return null;
  }

  if (parseTooltipRecordedAt(recordedAt) === null) {
    return null;
  }

  return { recordedAt, pefValue };
}

export function PefChartTooltip({ active, payload }: PefChartTooltipProps) {
  if (!active) {
    return null;
  }

  const point = readActivePefPoint(payload);

  if (point === null) {
    return null;
  }

  const formatted = formatPefChartDateTimeFromIso(point.recordedAt);

  if (formatted === null) {
    return null;
  }

  return (
    <div className="max-w-64 min-w-0 rounded-[var(--at-radius-md)] border border-[var(--at-border)] bg-[var(--at-surface)] px-3 py-2 shadow-[var(--at-shadow-sm)]">
      <p className="text-xs leading-snug break-words text-[var(--at-text-secondary)]">
        {formatted.date}, {formatted.time}
      </p>
      <p className="mt-1 text-sm font-medium tabular-nums text-[var(--at-text-primary)]">
        PEF: {point.pefValue} L/min
      </p>
    </div>
  );
}
