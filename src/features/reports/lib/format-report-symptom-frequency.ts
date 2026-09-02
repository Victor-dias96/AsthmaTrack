/**
 * Deterministic pt-BR formatters for symptom-frequency presentation.
 * Formatting is display-only and never changes the stored numeric result.
 */
const symptomIntegerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const symptomPercentageFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

export function formatReportSymptomPercentage(percentage: number): string {
  return symptomPercentageFormatter.format(percentage);
}

/**
 * Neutral count phrase for one symptom against the shared denominator.
 * Uses singular "registro" only when the denominator is 1.
 */
export function formatReportSymptomRecordPhrase(
  count: number,
  totalRecords: number
): string {
  const formattedCount = symptomIntegerFormatter.format(count);
  const formattedTotal = symptomIntegerFormatter.format(totalRecords);
  const recordWord = totalRecords === 1 ? "registro" : "registros";

  return `${formattedCount} de ${formattedTotal} ${recordWord}`;
}
