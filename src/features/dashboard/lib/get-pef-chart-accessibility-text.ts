import { formatPefChartDateTimeFromIso } from "./format-pef-chart-datetime";
import type { PefChartDatum } from "./normalize-pef-chart-points";

export const PEF_CHART_KEYBOARD_INSTRUCTIONS =
  "Use as setas para a esquerda e para a direita para navegar entre as medições do gráfico.";

/**
 * Concise textual summary of the normalized chronological PEF series.
 * Reports supplied measurements only; does not describe trend or control.
 */
export function getPefChartSummary(
  points: readonly PefChartDatum[]
): string | null {
  if (points.length === 0) {
    return null;
  }

  if (points.length === 1) {
    const point = points[0];
    const formatted = formatPefChartDateTimeFromIso(point.recordedAt);

    if (formatted === null) {
      return null;
    }

    return `Gráfico com uma medição de PEF em ${formatted.date}, às ${formatted.time}: ${point.pefValue} litros por minuto.`;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const firstFormatted = formatPefChartDateTimeFromIso(firstPoint.recordedAt);
  const lastFormatted = formatPefChartDateTimeFromIso(lastPoint.recordedAt);

  if (firstFormatted === null || lastFormatted === null) {
    return null;
  }

  return `Gráfico com ${points.length} medições de PEF. Primeira medição em ${firstFormatted.date}: ${firstPoint.pefValue} litros por minuto. Última medição em ${lastFormatted.date}: ${lastPoint.pefValue} litros por minuto.`;
}

/**
 * One accessible list item for a supplied PEF measurement.
 */
export function getPefChartMeasurementListItem(
  point: PefChartDatum
): string | null {
  const formatted = formatPefChartDateTimeFromIso(point.recordedAt);

  if (formatted === null) {
    return null;
  }

  return `${formatted.date}, ${formatted.time}: PEF ${point.pefValue} litros por minuto.`;
}
