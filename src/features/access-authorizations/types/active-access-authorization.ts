/**
 * Minimal, safe display model for one active patient-granted access
 * authorization (Issue 104). Deliberately excludes patientId,
 * professionalId, the authorization UUID's visibility, and any raw profile
 * or authorization row -- see
 * ../server/get-patient-active-access-authorizations for the validated
 * mapping from `public.get_patient_active_access_authorizations`.
 */
export type ActiveAccessAuthorization = {
  /**
   * Kept only as a stable React list key and for a future Issue 105
   * revocation control. Never rendered.
   */
  id: string;
  professionalName: string;
  /**
   * ISO timestamp of `patient_access_authorizations.created_at`. Always a
   * valid date -- see the loader's malformed-data handling. Formatted for
   * display by the presentational layer; never rendered raw.
   */
  grantedAt: string;
};
