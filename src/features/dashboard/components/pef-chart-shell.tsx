"use client";

import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import {
  normalizePefChartPoints,
  type PefChartDatum,
} from "../lib/normalize-pef-chart-points";
import type { PefChartPoint } from "../types/pef-chart-point";

export type PefChartShellProps = {
  data: readonly PefChartPoint[];
  titleId: string;
  descriptionId?: string;
};

const chartRegionClassName =
  "h-48 min-h-48 w-full min-w-0 overflow-hidden sm:h-56 md:h-64";

const emptyRegionClassName = [
  chartRegionClassName,
  "flex items-center justify-center px-4",
  "rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-border)]",
  "bg-[var(--at-surface-input)]/50",
].join(" ");

const PEF_CHART_STROKE = "var(--chart-1)";

function ChartStatusMessage({ children }: { children: string }) {
  return (
    <p className="text-center text-sm leading-relaxed text-[var(--at-text-secondary)]">
      {children}
    </p>
  );
}

function ChartStatusRegion({
  titleId,
  descriptionId,
  message,
}: {
  titleId: string;
  descriptionId?: string;
  message: string;
}) {
  return (
    <div
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="min-w-0"
    >
      <div className={emptyRegionClassName}>
        <ChartStatusMessage>{message}</ChartStatusMessage>
      </div>
    </div>
  );
}

function PefLineChart({ points }: { points: readonly PefChartDatum[] }) {
  return (
    <div className={chartRegionClassName}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          id="dashboard-pef-evolution-chart"
          data={points}
          accessibilityLayer
          margin={{ top: 12, right: 16, bottom: 12, left: 16 }}
        >
          <XAxis
            dataKey="chartKey"
            type="category"
            hide
            height={0}
            allowDuplicatedCategory
          />
          <YAxis hide width={0} />
          <Line
            id="dashboard-pef-series"
            type="linear"
            dataKey="pefValue"
            name="PEF"
            stroke={PEF_CHART_STROKE}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: PEF_CHART_STROKE,
              strokeWidth: 0,
            }}
            activeDot={{
              r: 4,
              fill: PEF_CHART_STROKE,
              strokeWidth: 0,
            }}
            isAnimationActive={false}
            connectNulls={false}
            legendType="none"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PefChartShell({
  data,
  titleId,
  descriptionId,
}: PefChartShellProps) {
  const presentation = useMemo(() => normalizePefChartPoints(data), [data]);

  if (presentation.status === "empty") {
    return (
      <ChartStatusRegion
        titleId={titleId}
        descriptionId={descriptionId}
        message="Registre medições para acompanhar a evolução do PEF."
      />
    );
  }

  if (presentation.status === "unavailable") {
    return (
      <ChartStatusRegion
        titleId={titleId}
        descriptionId={descriptionId}
        message="Não foi possível exibir as medições de PEF."
      />
    );
  }

  const isSinglePoint = presentation.points.length === 1;

  return (
    <div
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="min-w-0"
    >
      {isSinglePoint ? (
        <p className="mb-2 text-sm leading-relaxed text-[var(--at-text-secondary)]">
          Uma medição disponível.
        </p>
      ) : null}
      <PefLineChart points={presentation.points} />
    </div>
  );
}
