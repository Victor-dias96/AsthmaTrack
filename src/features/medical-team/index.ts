export { MedicalTeamShell } from "./components/medical-team-shell";
export { MedicalTeamUnavailableState } from "./components/medical-team-unavailable-state";
export { MEDICAL_NAV_ITEMS } from "./constants/nav-items";
export type { MedicalNavItem } from "./types/medical-nav-item";
export { isMedicalNavItemActive } from "./lib/is-medical-nav-item-active";

// Issue 107: authenticated medical-team member's authorized-patient list.
export { AuthorizedPatientList } from "./components/authorized-patient-list";
export { AuthorizedPatientItem } from "./components/authorized-patient-item";
export { AuthorizedPatientsEmptyState } from "./components/authorized-patients-empty-state";
export { AuthorizedPatientsUnavailableState } from "./components/authorized-patients-unavailable-state";
export type {
  MedicalAuthorizedLatestRecord,
  MedicalAuthorizedPatient,
  MedicalAuthorizedPatientsResult,
} from "./types/medical-authorized-patient";
export {
  getMedicalAuthorizedPatients,
} from "./server/get-medical-authorized-patients";
export { readMedicalTeamSession } from "./server/read-medical-team-session";
export type { MedicalTeamSession } from "./server/read-medical-team-session";
export { formatAuthorizedPatientCount } from "./lib/format-authorized-patient-count";

// Issue 108: name search over the already-authorized patient list.
export { AuthorizedPatientSearch } from "./components/authorized-patient-search";
export { AuthorizedPatientsNoResultsState } from "./components/authorized-patients-no-results-state";
export { parseAuthorizedPatientSearch } from "./lib/parse-authorized-patient-search";
export { formatAuthorizedPatientSearchCount } from "./lib/format-authorized-patient-search-count";
export {
  AUTHORIZED_PATIENTS_PATH,
  AUTHORIZED_PATIENT_SEARCH_PARAM,
  AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH,
} from "./constants/authorized-patients";

// Issue 110: read-only medical dashboard for one actively authorized patient.
export { MedicalPatientDashboardPageContent } from "./components/medical-patient-dashboard-page-content";
export { MedicalPatientDashboardHeader } from "./components/medical-patient-dashboard-header";
export { MedicalDashboardPeriodSelector } from "./components/medical-dashboard-period-selector";
export { MedicalPatientDashboardPefChart } from "./components/medical-patient-dashboard-pef-chart";
export { MedicalRecentRecordsSection } from "./components/medical-recent-records-section";
export { MedicalRecentRecordItem } from "./components/medical-recent-record-item";
export { MedicalPatientEmptyState } from "./components/medical-patient-empty-state";
export { MedicalPatientDashboardUnavailableState } from "./components/medical-patient-dashboard-unavailable-state";
export { MedicalPatientNotFoundState } from "./components/medical-patient-not-found-state";
export { parseMedicalPatientId } from "./lib/parse-medical-patient-id";
export { getMedicalPatientDashboardPeriodHref } from "./lib/get-medical-patient-dashboard-period-href";
export {
  normalizeMedicalDashboardRpcRows,
  parseMedicalPatientLatestRecordsRows,
  parseMedicalPatientPeriodRecordsRows,
} from "./lib/map-medical-patient-dashboard-record-row";
export { formatMedicalRecordSymptomIndication } from "./lib/format-medical-record-symptom-indication";
export { getMedicalAuthorizedPatientDashboardData } from "./server/get-medical-authorized-patient-dashboard-data";
export type {
  MedicalPatientDashboardData,
  MedicalPatientDashboardRecord,
  MedicalPatientDashboardResult,
} from "./types/medical-patient-dashboard";
