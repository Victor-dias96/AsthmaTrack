import { DASHBOARD_PERIOD_PARAM, type DashboardPeriod } from "@/features/dashboard";

import { AUTHORIZED_PATIENTS_PATH } from "../constants/authorized-patients";

/**
 * Builds one medical patient-dashboard period URL from the current route's
 * already-validated patient ID and an already-validated period (Issue 110).
 * Mirrors src/features/dashboard/lib/get-dashboard-period-href.ts. Never
 * accepts a user-supplied return URL, never adds the patient name, and
 * never places any health value in the query string -- `periodo` is the
 * only search parameter this builder ever sets.
 */
export function getMedicalPatientDashboardPeriodHref(
  patientId: string,
  period: DashboardPeriod
): string {
  const params = new URLSearchParams();
  params.set(DASHBOARD_PERIOD_PARAM, String(period));
  return `${AUTHORIZED_PATIENTS_PATH}/${patientId}?${params.toString()}`;
}
