import { MedicalPatientNotFoundState } from "@/features/medical-team";

/**
 * Route-level not-found boundary for /equipe-medica/pacientes/[patientId]
 * (Issue 110).
 *
 * This file's not-found boundary is installed inside the children slot of
 * the already-rendered src/app/equipe-medica/layout.tsx (which renders
 * MedicalTeamShell once for the whole /equipe-medica subtree) -- so this
 * component intentionally does NOT render MedicalTeamShell again; doing so
 * would duplicate the sidebar and mobile navigation.
 *
 * Reached whenever page.tsx calls notFound() for any of: a malformed
 * patientId, a nonexistent patient, a never-authorized patient, an
 * authorization directed to a different medical professional, a revoked
 * authorization, or an unsupported target profile role. All of these
 * collapse into the same safe, generic copy -- see
 * src/features/medical-team/components/medical-patient-not-found-state.tsx.
 */
export default function EquipeMedicaPacienteDashboardNotFound() {
  return <MedicalPatientNotFoundState />;
}
