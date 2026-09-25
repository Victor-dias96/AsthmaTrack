import {
  DASHBOARD_PERIOD_PARAM,
  type DashboardPeriod,
} from "@/features/dashboard/constants";
import {
  HISTORY_DEFAULT_PAGE,
  HISTORY_PAGE_PARAM,
} from "@/features/history/constants";

import { AUTHORIZED_PATIENTS_PATH } from "../constants/authorized-patients";

/** Read-only medical history route for one patient id. No query string. */
export function getMedicalPatientHistoryPath(patientId: string): string {
  return `${AUTHORIZED_PATIENTS_PATH}/${patientId}/historico`;
}

/** Read-only medical dashboard route for one patient id. No query string. */
export function getMedicalPatientDashboardPath(patientId: string): string {
  return `${AUTHORIZED_PATIENTS_PATH}/${patientId}`;
}

/**
 * History URL for an already-validated patient id, period and page.
 * `periodo` is always set. `pagina=1` is omitted. Never adds a patient
 * name, authorization id, record id or health value.
 */
export function getMedicalPatientHistoryHref(
  patientId: string,
  period: DashboardPeriod,
  page: number = HISTORY_DEFAULT_PAGE
): string {
  const params = new URLSearchParams();
  params.set(DASHBOARD_PERIOD_PARAM, String(period));

  if (page > HISTORY_DEFAULT_PAGE) {
    params.set(HISTORY_PAGE_PARAM, String(page));
  }

  return `${getMedicalPatientHistoryPath(patientId)}?${params.toString()}`;
}
