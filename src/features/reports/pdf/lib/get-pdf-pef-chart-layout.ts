import {
  doesPefChartRangeCrossYears,
  formatPefChartTickDate,
} from "@/features/daily-records/lib/format-pef-chart-tick-date";
import {
  getPefXAxisDomain,
  getPefYAxisDomain,
} from "@/features/daily-records/lib/get-pef-chart-axis-domains";

const PDF_PEF_CHART_Y_TICK_STEPS = 4;

export type PdfPefChartInputPoint = {
  pefValue: number;
  recordedAtMs: number;
};

export type PdfPefChartPlottedPoint = PdfPefChartInputPoint & {
  x: number;
  y: number;
};

export type PdfPefChartAxisTick = {
  position: number;
  label: string;
  align: "start" | "middle" | "end";
};

export type PdfPefChartLayout = {
  points: readonly PdfPefChartPlottedPoint[];
  yTicks: readonly PdfPefChartAxisTick[];
  xTicks: readonly PdfPefChartAxisTick[];
};

function buildYTicks(
  yMin: number,
  yMax: number,
  plotHeight: number
): PdfPefChartAxisTick[] {
  const span = yMax - yMin;
  const ticks: PdfPefChartAxisTick[] = [];

  for (let step = 0; step <= PDF_PEF_CHART_Y_TICK_STEPS; step += 1) {
    const ratio = step / PDF_PEF_CHART_Y_TICK_STEPS;
    const value = yMin + span * ratio;

    ticks.push({
      position: plotHeight - ratio * plotHeight,
      label: String(Math.round(value)),
      align: "end",
    });
  }

  return ticks;
}

function buildXTicks(
  points: readonly PdfPefChartPlottedPoint[],
  includeYear: boolean
): PdfPefChartAxisTick[] {
  if (points.length === 0) {
    return [];
  }

  const first = points[0];

  if (points.length === 1) {
    return [
      {
        position: first.x,
        label: formatPefChartTickDate(first.recordedAtMs, includeYear),
        align: "middle",
      },
    ];
  }

  const last = points[points.length - 1];

  return [
    {
      position: first.x,
      label: formatPefChartTickDate(first.recordedAtMs, includeYear),
      align: "start",
    },
    {
      position: last.x,
      label: formatPefChartTickDate(last.recordedAtMs, includeYear),
      align: "end",
    },
  ];
}

/**
 * Deterministic data-space to PDF-space mapping for the PEF evolution chart
 * (Issue 98). Pure and typed; performs no Supabase query, no DOM
 * measurement and no browser API.
 *
 * Reuses the exact same Y/X domain policy as the browser chart
 * (`getPefYAxisDomain` / `getPefXAxisDomain`) so the visual scale never
 * diverges between the browser report and the PDF. The Y lower bound is
 * never negative and a single or equal-value series never collapses to a
 * zero-height or zero-width domain. Every supplied point is preserved and
 * fitted inside the plotting area; nothing is invented or interpolated
 * beyond straight segments between consecutive supplied points.
 *
 * Returns null only for an empty input — the caller renders the
 * unavailable-chart message in that case.
 */
export function getPdfPefChartLayout(
  points: readonly PdfPefChartInputPoint[],
  plotWidth: number,
  plotHeight: number
): PdfPefChartLayout | null {
  if (points.length === 0) {
    return null;
  }

  const pefValues = points.map((point) => point.pefValue);
  const timestamps = points.map((point) => point.recordedAtMs);

  const [yMin, yMax] = getPefYAxisDomain([
    Math.min(...pefValues),
    Math.max(...pefValues),
  ]);
  const [xMin, xMax] = getPefXAxisDomain([
    Math.min(...timestamps),
    Math.max(...timestamps),
  ]);

  const ySpan = yMax - yMin === 0 ? 1 : yMax - yMin;
  const xSpan = xMax - xMin === 0 ? 1 : xMax - xMin;

  const plotted: PdfPefChartPlottedPoint[] = points.map((point) => ({
    ...point,
    x: ((point.recordedAtMs - xMin) / xSpan) * plotWidth,
    y: plotHeight - ((point.pefValue - yMin) / ySpan) * plotHeight,
  }));

  const includeYear = doesPefChartRangeCrossYears(timestamps);

  return {
    points: plotted,
    yTicks: buildYTicks(yMin, yMax, plotHeight),
    xTicks: buildXTicks(plotted, includeYear),
  };
}
