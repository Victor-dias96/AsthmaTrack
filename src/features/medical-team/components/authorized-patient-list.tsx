import { AuthorizedPatientItem } from "./authorized-patient-item";
import type { MedicalAuthorizedPatient } from "../types/medical-authorized-patient";

type AuthorizedPatientListProps = {
  patients: readonly MedicalAuthorizedPatient[];
};

/**
 * Reusable, presentational authorized-patient list (Issue 107). Performs
 * no Supabase query, no authentication and no mutation; accepts only
 * minimal, already-validated, serializable display data and never mutates
 * it. The authorization id is used solely as the stable React key, never
 * rendered. One column on mobile, up to two columns on wider screens.
 * Latest PEF and latest-record date are already resolved on each patient;
 * this list never fetches health data itself. Mirrors
 * src/features/access-authorizations/components/active-access-list.tsx.
 */
export function AuthorizedPatientList({ patients }: AuthorizedPatientListProps) {
  return (
    <ul className="min-w-0 space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
      {patients.map((patient) => (
        <AuthorizedPatientItem key={patient.authorizationId} patient={patient} />
      ))}
    </ul>
  );
}
