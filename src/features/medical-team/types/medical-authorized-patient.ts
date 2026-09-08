/**
 * Latest daily-record summary for one actively authorized patient
 * (Issue 109). PEF and recordedAt always belong to the same record when
 * `kind` is `"ready"`. `"empty"` is a successful zero-record result.
 * `"unavailable"` is a malformed latest-record payload that must not be
 * displayed as a value or as "no records".
 */
export type MedicalAuthorizedLatestRecord =
  | {
      readonly kind: "ready";
      readonly pefValue: number;
      readonly recordedAt: string;
    }
  | { readonly kind: "empty" }
  | { readonly kind: "unavailable" };

/**
 * Minimal, safe display model for one patient linked through an active
 * authorization directed to the authenticated medical-team professional
 * (Issues 107 and 109). Deliberately excludes professionalId, patient
 * email, patient role, onboarding status, notes, symptoms, attacks,
 * medication and complete DailyRecord objects -- see
 * ../server/get-medical-authorized-patients.ts for the validated mapping
 * from `public.get_medical_authorized_patients`.
 */
export type MedicalAuthorizedPatient = {
  /**
   * Kept only as a stable React list key. Never rendered.
   */
  readonly authorizationId: string;
  /**
   * Kept server-side for a future secure patient-detail route (Issues
   * 110-112). Never rendered and never placed in a URL by this issue.
   */
  readonly patientId: string;
  readonly patientName: string;
  /**
   * ISO timestamp of `patient_access_authorizations.created_at`. Always a
   * valid date -- see the loader's malformed-data handling. Formatted for
   * display by the presentational layer; never rendered raw.
   */
  readonly authorizedAt: string;
  /**
   * Latest valid daily record for this authorized patient, or a safe
   * empty/unavailable summary. Never a complete daily-record row.
   */
  readonly latestRecord: MedicalAuthorizedLatestRecord;
};

export type MedicalAuthorizedPatientsResult =
  | { status: "ready"; patients: readonly MedicalAuthorizedPatient[] }
  | { status: "empty" }
  | { status: "no-results" }
  | { status: "unavailable" };
