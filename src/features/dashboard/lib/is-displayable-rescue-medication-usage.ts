/**
 * Defensive presentation check for a rescue-medication usage count shown in the dashboard.
 * Does not replace database or aggregation validation.
 */
export function isDisplayableRescueMedicationUsage(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}
