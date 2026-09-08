/**
 * Minimal, safe display model for one patient linked through an active
 * authorization directed to the authenticated medical-team professional
 * (Issue 107). Deliberately excludes professionalId, patient email, patient
 * role, onboarding status and any health data (PEF, symptoms, notes,
 * attacks, medication) -- see
 * ../server/get-medical-authorized-patients.ts for the validated mapping
 * from `public.get_medical_authorized_patients`.
 */
export type MedicalAuthorizedPatient = {
  /**
   * Kept only as a stable React list key. Never rendered.
   */
  authorizationId: string;
  /**
   * Kept server-side for a future secure patient-detail route (Issues
   * 110-112). Never rendered and never placed in a URL by this issue.
   */
  patientId: string;
  patientName: string;
  /**
   * ISO timestamp of `patient_access_authorizations.created_at`. Always a
   * valid date -- see the loader's malformed-data handling. Formatted for
   * display by the presentational layer; never rendered raw.
   */
  authorizedAt: string;
};
