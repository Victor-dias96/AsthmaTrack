import { REPORT_MISSING_PATIENT_NAME } from "../constants";

/**
 * Normalizes a stored full name for report display without mutating the
 * profile. Empty, whitespace-only and missing values become the neutral
 * fallback. Never uses email or identifiers.
 */
export function formatReportPatientName(fullName: string | null): string {
  if (fullName === null) {
    return REPORT_MISSING_PATIENT_NAME;
  }

  const normalized = fullName.trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    return REPORT_MISSING_PATIENT_NAME;
  }

  return normalized;
}
