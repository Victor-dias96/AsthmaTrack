/**
 * Defensive presentation check for a daily-record total shown in the dashboard.
 * Does not replace database or aggregation validation.
 */
export function isDisplayableTotalRecords(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}
