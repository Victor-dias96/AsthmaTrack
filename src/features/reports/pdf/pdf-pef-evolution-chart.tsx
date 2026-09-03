import { Circle, G, Line, Polyline, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";

import { getPefChartSummary } from "@/features/daily-records/lib/get-pef-chart-accessibility-text";
import { normalizePefChartPoints } from "@/features/daily-records/lib/normalize-pef-chart-points";
import type { PefChartPoint } from "@/features/daily-records/types/pef-chart-point";

import {
  REPORT_PDF_CHART_HEIGHT,
  REPORT_PDF_CHART_PADDING,
  REPORT_PDF_CHART_UNAVAILABLE_MESSAGE,
  REPORT_PDF_CHART_WIDTH,
} from "./constants";
import { getPdfPefChartLayout } from "./lib/get-pdf-pef-chart-layout";

const PLOT_WIDTH =
  REPORT_PDF_CHART_WIDTH - REPORT_PDF_CHART_PADDING.left - REPORT_PDF_CHART_PADDING.right;
const PLOT_HEIGHT =
  REPORT_PDF_CHART_HEIGHT - REPORT_PDF_CHART_PADDING.top - REPORT_PDF_CHART_PADDING.bottom;

const PEF_CHART_LINE_COLOR = "#1e4ee8";
const PEF_CHART_GRID_COLOR = "#e2e8f0";
const PEF_CHART_AXIS_TEXT_COLOR = "#6b7280";
const PEF_CHART_POINT_RADIUS = 2.4;
const Y_TICK_LABEL_WIDTH = REPORT_PDF_CHART_PADDING.left - 4;
const X_TICK_LABEL_WIDTH = 60;

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    width: REPORT_PDF_CHART_WIDTH,
    height: REPORT_PDF_CHART_HEIGHT,
  },
  unitLabel: {
    fontSize: 7,
    color: PEF_CHART_AXIS_TEXT_COLOR,
    marginBottom: 2,
  },
  yTickLabel: {
    position: "absolute",
    left: 0,
    width: Y_TICK_LABEL_WIDTH,
    fontSize: 7,
    color: PEF_CHART_AXIS_TEXT_COLOR,
    textAlign: "right",
  },
  xTickLabel: {
    position: "absolute",
    top: REPORT_PDF_CHART_PADDING.top + PLOT_HEIGHT + 4,
    width: X_TICK_LABEL_WIDTH,
    fontSize: 7,
    color: PEF_CHART_AXIS_TEXT_COLOR,
  },
  summary: {
    marginTop: 6,
    fontSize: 8,
    color: PEF_CHART_AXIS_TEXT_COLOR,
    lineHeight: 1.4,
  },
  unavailable: {
    fontSize: 9,
    color: PEF_CHART_AXIS_TEXT_COLOR,
  },
});

export type PdfPefEvolutionChartProps = {
  data: readonly PefChartPoint[];
};

/**
 * PDF-specific vector PEF evolution chart (Issue 98). Renders one neutral
 * line and one point per supplied measurement using PDF-library SVG
 * primitives — never a screenshot, never an uploaded image, never browser
 * canvas or DOM. Performs no Supabase query and accepts no patient ID or
 * raw record.
 *
 * Delegates chronological validation and deduplication to the same
 * `normalizePefChartPoints` helper the browser chart uses, and delegates
 * data-to-pixel mapping to the pure `getPdfPefChartLayout` helper so the
 * visual scale matches the browser chart's Y/X domain policy. Draws no
 * tooltip, no clinical zone, no threshold, no average or trend line.
 */
export function PdfPefEvolutionChart({ data }: PdfPefEvolutionChartProps) {
  const presentation = normalizePefChartPoints(data);

  if (presentation.status !== "ready") {
    return <Text style={styles.unavailable}>{REPORT_PDF_CHART_UNAVAILABLE_MESSAGE}</Text>;
  }

  const layout = getPdfPefChartLayout(
    presentation.points.map((point) => ({
      pefValue: point.pefValue,
      recordedAtMs: point.recordedTimestamp,
    })),
    PLOT_WIDTH,
    PLOT_HEIGHT
  );

  if (layout === null) {
    return <Text style={styles.unavailable}>{REPORT_PDF_CHART_UNAVAILABLE_MESSAGE}</Text>;
  }

  const summary = getPefChartSummary(presentation.points);
  const polylinePoints = layout.points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const hasMultiplePoints = layout.points.length > 1;

  return (
    <View wrap={false}>
      <Text style={styles.unitLabel}>L/min</Text>
      <View style={styles.wrapper}>
        <Svg width={REPORT_PDF_CHART_WIDTH} height={REPORT_PDF_CHART_HEIGHT}>
          <G
            transform={`translate(${REPORT_PDF_CHART_PADDING.left}, ${REPORT_PDF_CHART_PADDING.top})`}
          >
            {layout.yTicks.map((tick) => (
              <Line
                key={`pdf-pef-grid-${tick.position}`}
                x1={0}
                y1={tick.position}
                x2={PLOT_WIDTH}
                y2={tick.position}
                stroke={PEF_CHART_GRID_COLOR}
                strokeWidth={0.75}
              />
            ))}
            {hasMultiplePoints ? (
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke={PEF_CHART_LINE_COLOR}
                strokeWidth={1.5}
              />
            ) : null}
            {layout.points.map((point, index) => (
              <Circle
                key={`pdf-pef-point-${index}`}
                cx={point.x}
                cy={point.y}
                r={PEF_CHART_POINT_RADIUS}
                fill={PEF_CHART_LINE_COLOR}
              />
            ))}
          </G>
        </Svg>
        {layout.yTicks.map((tick) => (
          <Text
            key={`pdf-pef-ytick-${tick.position}`}
            style={[
              styles.yTickLabel,
              { top: REPORT_PDF_CHART_PADDING.top + tick.position - 4 },
            ]}
          >
            {tick.label}
          </Text>
        ))}
        {layout.xTicks.map((tick) => (
          <Text
            key={`pdf-pef-xtick-${tick.position}-${tick.label}`}
            style={[
              styles.xTickLabel,
              {
                left:
                  REPORT_PDF_CHART_PADDING.left +
                  tick.position -
                  (tick.align === "start"
                    ? 0
                    : tick.align === "end"
                      ? X_TICK_LABEL_WIDTH
                      : X_TICK_LABEL_WIDTH / 2),
                textAlign:
                  tick.align === "middle"
                    ? "center"
                    : tick.align === "end"
                      ? "right"
                      : "left",
              },
            ]}
          >
            {tick.label}
          </Text>
        ))}
      </View>
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}
    </View>
  );
}
