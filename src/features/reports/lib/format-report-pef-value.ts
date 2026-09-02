/**
 * Deterministic pt-BR formatters for PEF summary presentation.
 * Formatting is display-only and never changes the stored numeric result.
 */
const pefIntegerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const pefAverageFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

export function formatReportPefInteger(value: number): string {
  return pefIntegerFormatter.format(value);
}

export function formatReportPefAverage(value: number): string {
  return pefAverageFormatter.format(value);
}

/**
 * Neutral supporting copy for the number of valid PEF measurements used
 * in the selected-period statistics. Distinct from the period record count.
 */
export function formatReportPefMeasurementCount(count: number): string {
  if (count === 1) {
    return "Calculado com base em 1 medição no período.";
  }

  return `Calculado com base em ${count} medições no período.`;
}
