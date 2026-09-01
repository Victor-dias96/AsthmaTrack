/**
 * Defensive presentation check for a PEF measurement shown in the dashboard.
 * Does not replace database or form validation.
 */
export function isDisplayablePefValue(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
