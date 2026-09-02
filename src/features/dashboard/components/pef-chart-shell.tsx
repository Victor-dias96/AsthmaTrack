"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  doesPefChartRangeCrossYears,
  formatPefChartTickDate,
} from "../lib/format-pef-chart-tick-date";
import {
  getPefXAxisDomain,
  getPefYAxisDomain,
} from "../lib/get-pef-chart-axis-domains";
import {
  getPefChartMeasurementListItem,
  getPefChartSummary,
  PEF_CHART_KEYBOARD_INSTRUCTIONS,
} from "../lib/get-pef-chart-accessibility-text";
import {
  normalizePefChartPoints,
  type PefChartDatum,
} from "../lib/normalize-pef-chart-points";
import type { PefChartPoint } from "../types/pef-chart-point";
import { PefChartTooltip } from "./pef-chart-tooltip";

export type PefChartShellProps = {
  data: readonly PefChartPoint[];
  titleId: string;
  descriptionId?: string;
};

const chartRegionSizeClassName =
  "h-48 min-h-48 w-full min-w-0 overflow-hidden sm:h-56 md:h-64";

const chartRegionClassName = [
  chartRegionSizeClassName,
  "[&_.recharts-surface]:outline-none",
  "[&_.recharts-surface:focus-visible]:ring-2",
  "[&_.recharts-surface:focus-visible]:ring-[var(--at-blue)]",
  "[&_.recharts-surface:focus-visible]:ring-offset-2",
].join(" ");

const PEF_CHART_SUMMARY_ID = "dashboard-pef-chart-summary";
const PEF_CHART_INSTRUCTIONS_ID = "dashboard-pef-chart-instructions";
const PEF_CHART_MEASUREMENTS_ID = "dashboard-pef-chart-measurements";
const PEF_CHART_ACCESSIBLE_NAME = "Evolução do PEF";

const emptyRegionClassName = [
  chartRegionSizeClassName,
  "flex items-center justify-center px-4",
  "rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-border)]",
  "bg-[var(--at-surface-input)]/50",
].join(" ");

const PEF_CHART_STROKE = "var(--chart-1)";
const PEF_CHART_GRID_STROKE = "var(--at-border)";
const PEF_CHART_AXIS_TICK = "var(--at-text-secondary)";
const PEF_CHART_AXIS_LINE = "var(--at-border)";
const PEF_CHART_TICK_FONT_SIZE = 12;
const PEF_CHART_Y_AXIS_WIDTH = 44;
const PEF_CHART_X_AXIS_HEIGHT = 32;
const PEF_CHART_X_MIN_TICK_GAP = 24;
const PEF_CHART_MARGIN = { top: 8, right: 16, bottom: 4, left: 4 } as const;
const PEF_CHART_X_PADDING = { left: 12, right: 12 } as const;
const PEF_CHART_Y_PADDING = { top: 8, bottom: 8 } as const;

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

function formatPefYAxisTick(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  return String(Math.round(value));
}

function joinDescribedBy(
  ids: readonly (string | undefined)[]
): string | undefined {
  const present = ids.filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );

  return present.length > 0 ? present.join(" ") : undefined;
}

function getAccessibleMeasurementItems(points: readonly PefChartDatum[]) {
  const items: { chartKey: string; text: string }[] = [];

  for (const point of points) {
    const text = getPefChartMeasurementListItem(point);

    if (text === null) {
      continue;
    }

    items.push({ chartKey: point.chartKey, text });
  }

  return items;
}

function PefLineChart({ points }: { points: readonly PefChartDatum[] }) {
  const includeYear = useMemo(
    () =>
      doesPefChartRangeCrossYears(
        points.map((point) => point.recordedTimestamp)
      ),
    [points]
  );

  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs text-[var(--at-text-secondary)]">
        <span aria-hidden="true">L/min</span>
        <span className="sr-only">
          Unidade do eixo vertical: litros por minuto.
        </span>
      </p>
      <div className={chartRegionClassName}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            id="dashboard-pef-evolution-chart"
            data={points}
            accessibilityLayer
            desc={PEF_CHART_ACCESSIBLE_NAME}
            margin={PEF_CHART_MARGIN}
          >
            <CartesianGrid
              aria-hidden
              vertical={false}
              stroke={PEF_CHART_GRID_STROKE}
              strokeDasharray="3 3"
              syncWithTicks
            />
            <XAxis
              dataKey="recordedTimestamp"
              type="number"
              scale="time"
              domain={getPefXAxisDomain}
              name="Data da medição"
              interval="preserveStartEnd"
              minTickGap={PEF_CHART_X_MIN_TICK_GAP}
              height={PEF_CHART_X_AXIS_HEIGHT}
              padding={PEF_CHART_X_PADDING}
              tickMargin={8}
              fontSize={PEF_CHART_TICK_FONT_SIZE}
              tick={{
                fill: PEF_CHART_AXIS_TICK,
                fontSize: PEF_CHART_TICK_FONT_SIZE,
              }}
              tickLine={false}
              axisLine={{ stroke: PEF_CHART_AXIS_LINE }}
              tickFormatter={(value: unknown) =>
                formatPefChartTickDate(value, includeYear)
              }
            />
            <YAxis
              dataKey="pefValue"
              type="number"
              domain={getPefYAxisDomain}
              allowDecimals={false}
              tickCount={5}
              name="PEF"
              width={PEF_CHART_Y_AXIS_WIDTH}
              padding={PEF_CHART_Y_PADDING}
              tickMargin={6}
              fontSize={PEF_CHART_TICK_FONT_SIZE}
              tick={{
                fill: PEF_CHART_AXIS_TICK,
                fontSize: PEF_CHART_TICK_FONT_SIZE,
              }}
              tickLine={false}
              axisLine={{ stroke: PEF_CHART_AXIS_LINE }}
              tickFormatter={formatPefYAxisTick}
            />
            <Tooltip
              content={PefChartTooltip}
              isAnimationActive={false}
              cursor={{
                stroke: PEF_CHART_AXIS_LINE,
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              wrapperStyle={{
                maxWidth: "16rem",
                outline: "none",
              }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
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
  const hasMultiplePoints = presentation.points.length >= 2;
  const summary = getPefChartSummary(presentation.points);
  const measurementItems = hasMultiplePoints
    ? getAccessibleMeasurementItems(presentation.points)
    : [];

  return (
    <div
      aria-labelledby={titleId}
      aria-describedby={joinDescribedBy([
        descriptionId,
        summary ? PEF_CHART_SUMMARY_ID : undefined,
        hasMultiplePoints ? PEF_CHART_INSTRUCTIONS_ID : undefined,
      ])}
      className="min-w-0"
    >
      {isSinglePoint ? (
        <p
          aria-hidden="true"
          className="mb-2 text-sm leading-relaxed text-[var(--at-text-secondary)]"
        >
          Uma medição disponível.
        </p>
      ) : null}
      {summary ? (
        <p id={PEF_CHART_SUMMARY_ID} className="sr-only">
          {summary}
        </p>
      ) : null}
      {hasMultiplePoints ? (
        <p id={PEF_CHART_INSTRUCTIONS_ID} className="sr-only">
          {PEF_CHART_KEYBOARD_INSTRUCTIONS}
        </p>
      ) : null}
      <PefLineChart points={presentation.points} />
      {measurementItems.length > 0 ? (
        <ol id={PEF_CHART_MEASUREMENTS_ID} className="sr-only">
          {measurementItems.map((item) => (
            <li key={item.chartKey}>{item.text}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
