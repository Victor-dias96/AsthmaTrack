import {
  REPORT_PERIOD_PARAM,
  type ReportPeriod,
} from "@/features/reports/constants";

import { AUTHORIZED_PATIENTS_PATH } from "../constants/authorized-patients";

/** Read-only medical report route for one patient id. No query string. */
export function getMedicalPatientReportPath(patientId: string): string {
  return `${AUTHORIZED_PATIENTS_PATH}/${patientId}/relatorio`;
}

/**
 * Report URL for an already-validated patient id and report period.
 * `periodo` is the only search parameter. Never adds a patient name,
 * authorization id, record id, return URL or health value, and never
 * points at the patient-owned report route.
 */
export function getMedicalPatientReportHref(
  patientId: string,
  period: ReportPeriod
): string {
  const params = new URLSearchParams();
  params.set(REPORT_PERIOD_PARAM, String(period));
  return `${getMedicalPatientReportPath(patientId)}?${params.toString()}`;
}
