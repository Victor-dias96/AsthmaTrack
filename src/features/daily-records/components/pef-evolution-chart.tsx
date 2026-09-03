"use client";

import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
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

export type PefChartPrintBox = {
  width: number;
  height: number;
};

export type PefEvolutionChartProps = {
  data: readonly PefChartPoint[];
  emptyMessage: string;
  unavailableMessage: string;
  accessibleLabel: string;
  titleId: string;
  descriptionId?: string;
  /**
   * When set, print media uses these fixed pixel dimensions so Recharts
   * does not unmount the SVG after a zero-size print measurement.
   */
  printBox?: PefChartPrintBox;
};

type PefChartBoxSize = PefChartPrintBox | { width: "100%"; height: "100%" };

const SCREEN_CHART_BOX: PefChartBoxSize = {
  width: "100%",
  height: "100%",
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

function PefLineChart({
  points,
  accessibleLabel,
  chartId,
  seriesId,
  boxSize,
}: {
  points: readonly PefChartDatum[];
  accessibleLabel: string;
  chartId: string;
  seriesId: string;
  boxSize: PefChartBoxSize;
}) {
  const includeYear = useMemo(
    () =>
      doesPefChartRangeCrossYears(
        points.map((point) => point.recordedTimestamp)
      ),
    [points]
  );
  const isFixedBox = typeof boxSize.width === "number";

  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs text-[var(--at-text-secondary)]">
        <span aria-hidden="true">L/min</span>
        <span className="sr-only">
          Unidade do eixo vertical: litros por minuto.
        </span>
      </p>
      <div
        className={chartRegionClassName}
        style={
          isFixedBox
            ? {
                width: boxSize.width,
                height: boxSize.height,
                overflow: "visible",
              }
            : undefined
        }
      >
        <ResponsiveContainer
          width={boxSize.width}
          height={boxSize.height}
          minWidth={0}
        >
          <LineChart
            id={chartId}
            data={points}
            accessibilityLayer
            desc={accessibleLabel}
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
              id={seriesId}
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

export function PefEvolutionChart({
  data,
  emptyMessage,
  unavailableMessage,
  accessibleLabel,
  titleId,
  descriptionId,
  printBox,
}: PefEvolutionChartProps) {
  const summaryId = `${titleId}-summary`;
  const instructionsId = `${titleId}-instructions`;
  const measurementsId = `${titleId}-measurements`;
  const chartId = `${titleId}-chart`;
  const seriesId = `${titleId}-series`;
  const [isPrintLayout, setIsPrintLayout] = useState(false);
  const presentation = useMemo(() => normalizePefChartPoints(data), [data]);
  const boxSize: PefChartBoxSize =
    isPrintLayout && printBox !== undefined ? printBox : SCREEN_CHART_BOX;

  useEffect(() => {
    if (printBox === undefined) {
      return;
    }

    function enterPrintLayout() {
      flushSync(() => {
        setIsPrintLayout(true);
      });
    }

    function exitPrintLayout() {
      flushSync(() => {
        setIsPrintLayout(false);
      });
    }

    function handlePrintMediaChange(event: MediaQueryListEvent) {
      if (event.matches) {
        enterPrintLayout();
      } else {
        exitPrintLayout();
      }
    }

    const printMedia = window.matchMedia("print");
    printMedia.addEventListener("change", handlePrintMediaChange);
    window.addEventListener("beforeprint", enterPrintLayout);
    window.addEventListener("afterprint", exitPrintLayout);

    return () => {
      printMedia.removeEventListener("change", handlePrintMediaChange);
      window.removeEventListener("beforeprint", enterPrintLayout);
      window.removeEventListener("afterprint", exitPrintLayout);
    };
  }, [printBox]);

  if (presentation.status === "empty") {
    return (
      <ChartStatusRegion
        titleId={titleId}
        descriptionId={descriptionId}
        message={emptyMessage}
      />
    );
  }

  if (presentation.status === "unavailable") {
    return (
      <ChartStatusRegion
        titleId={titleId}
        descriptionId={descriptionId}
        message={unavailableMessage}
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
        summary ? summaryId : undefined,
        hasMultiplePoints ? instructionsId : undefined,
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
        <p id={summaryId} className="sr-only">
          {summary}
        </p>
      ) : null}
      {hasMultiplePoints ? (
        <p id={instructionsId} className="sr-only">
          {PEF_CHART_KEYBOARD_INSTRUCTIONS}
        </p>
      ) : null}
      <PefLineChart
        points={presentation.points}
        accessibleLabel={accessibleLabel}
        chartId={chartId}
        seriesId={seriesId}
        boxSize={boxSize}
      />
      {measurementItems.length > 0 ? (
        <ol id={measurementsId} className="sr-only">
          {measurementItems.map((item) => (
            <li key={item.chartKey}>{item.text}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
