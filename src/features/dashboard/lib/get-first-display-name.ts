/**
 * Returns the first meaningful name from a stored full name.
 * Does not mutate the original profile value.
 */
export function getFirstDisplayName(fullName: string | null): string | null {
  if (fullName === null) {
    return null;
  }

  const firstName = fullName.trim().split(/\s+/)[0];

  if (!firstName) {
    return null;
  }

  return firstName;
}
