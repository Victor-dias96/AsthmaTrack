import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppAlert } from "@/components/ui/app-alert";
import {
  AuthorizedPatientList,
  AuthorizedPatientsEmptyState,
  AuthorizedPatientsUnavailableState,
  formatAuthorizedPatientCount,
  getMedicalAuthorizedPatients,
  readMedicalTeamSession,
} from "@/features/medical-team";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pacientes",
};

// Authorized-patient relationships are private, per-professional data that
// change whenever a patient grants or revokes access elsewhere; never
// serve this list from a cached shell (mirrors the established convention
// in src/app/paciente/configuracoes/acessos/page.tsx).
export const dynamic = "force-dynamic";

/**
 * Server-rendered authorized-patient list for the authenticated
 * medical-team member (Issue 107).
 *
 * The /equipe-medica layout (src/app/equipe-medica/layout.tsx) already
 * verifies authentication and the persisted medical role before this page
 * ever renders -- a patient-role profile is redirected to
 * /paciente/dashboard there, never here. This page re-verifies the
 * request-bound identity once more before querying, following the same
 * established convention already used by
 * src/app/paciente/configuracoes/acessos/page.tsx (a Server Component
 * boundary re-verifies identity rather than trusting data implicitly
 * passed down from an ancestor layout).
 *
 * Queries only active (revoked_at is null) authorizations directed to the
 * caller's own verified identity via
 * `public.get_medical_authorized_patients` -- never a broader patient
 * directory, and never public.daily_records or any other health data.
 */
export default async function EquipeMedicaPacientesPage() {
  const supabase = await createClient();
  const session = await readMedicalTeamSession(supabase);

  if (session.status === "unauthenticated") {
    redirect("/login");
  }

  const result = await getMedicalAuthorizedPatients(supabase);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
          Pacientes
        </h1>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Pacientes que autorizaram o acesso aos dados no AsthmaTrack.
        </p>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Somente pacientes com autorização ativa são exibidos.
        </p>
      </div>

      <AppAlert variant="info">
        O paciente autorizou o acesso em modo somente leitura.
      </AppAlert>

      {result.status === "unavailable" && (
        <AuthorizedPatientsUnavailableState />
      )}

      {result.status === "empty" && <AuthorizedPatientsEmptyState />}

      {result.status === "ready" && (
        <>
          <p className="text-sm text-[var(--at-text-secondary)]">
            {formatAuthorizedPatientCount(result.patients.length)}
          </p>
          <AuthorizedPatientList patients={result.patients} />
        </>
      )}
    </div>
  );
}
