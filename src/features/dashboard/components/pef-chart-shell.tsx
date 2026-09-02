"use client";

import { ResponsiveContainer } from "recharts";

import type { PefChartPoint } from "../types/pef-chart-point";

export type PefChartShellProps = {
  data?: readonly PefChartPoint[];
  titleId: string;
  descriptionId?: string;
};

const chartRegionClassName =
  "h-48 min-h-48 w-full min-w-0 overflow-hidden sm:h-56 md:h-64";

export function PefChartShell({
  data = [],
  titleId,
  descriptionId,
}: PefChartShellProps) {
  const hasChartPoints = data.length > 0;

  if (!hasChartPoints) {
    return (
      <div
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="min-w-0"
      >
        <div
          aria-hidden="true"
          className={`${chartRegionClassName} rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-border)] bg-[var(--at-surface-input)]/50`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <div aria-hidden="true" className="h-full w-full" />
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="min-w-0"
    >
      <div className={chartRegionClassName}>
        <ResponsiveContainer width="100%" height="100%">
          <div aria-hidden="true" className="h-full w-full" />
        </ResponsiveContainer>
      </div>
    </div>
  );
}
