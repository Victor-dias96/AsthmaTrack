/**
 * Deterministic pt-BR copy for the recorded-attack summary.
 * Display-only; never changes the stored count.
 */
const attackCountFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

export type ReportRecordedAttackCountParts = {
  formattedCount: string;
  phrase: string;
};

/**
 * Neutral count parts for matching attack-reporting records.
 * Uses singular "crise" only when the count is 1. Not used for zero.
 */
export function formatReportRecordedAttackCountParts(
  count: number
): ReportRecordedAttackCountParts {
  return {
    formattedCount: attackCountFormatter.format(count),
    phrase:
      count === 1
        ? "crise registrada no período"
        : "crises registradas no período",
  };
}

/**
 * Neutral count phrase for matching attack-reporting records.
 * Uses singular "crise" only when the count is 1. Not used for zero.
 */
export function formatReportRecordedAttackCount(count: number): string {
  const { formattedCount, phrase } =
    formatReportRecordedAttackCountParts(count);

  return `${formattedCount} ${phrase}`;
}
