/**
 * Defensive presentation check for a symptom-day count shown in the dashboard.
 * Does not replace database or aggregation validation.
 */
export function isDisplayableDaysWithSymptoms(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}
