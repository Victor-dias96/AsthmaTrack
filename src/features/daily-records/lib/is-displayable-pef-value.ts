/**
 * Defensive presentation check for a PEF measurement.
 * Does not replace database or form validation.
 */
export function isDisplayablePefValue(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
