import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppAlert } from "@/components/ui/app-alert";
import {
  AUTHORIZED_PATIENT_SEARCH_PARAM,
  AuthorizedPatientList,
  AuthorizedPatientSearch,
  AuthorizedPatientsEmptyState,
  AuthorizedPatientsNoResultsState,
  AuthorizedPatientsUnavailableState,
  formatAuthorizedPatientCount,
  formatAuthorizedPatientSearchCount,
  getMedicalAuthorizedPatients,
  parseAuthorizedPatientSearch,
  readMedicalTeamSession,
} from "@/features/medical-team";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pacientes",
};

// Authorized-patient relationships and latest-record summaries are
// private, per-professional data that change whenever a patient grants or
// revokes access elsewhere; never serve this list from a cached shell
// (mirrors the established convention in
// src/app/paciente/configuracoes/acessos/page.tsx).
export const dynamic = "force-dynamic";

/**
 * Server-rendered authorized-patient list for the authenticated
 * medical-team member (Issue 107), with optional name search (Issue 108)
 * and each card's latest PEF plus latest record date (Issue 109).
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
 * Reads `q` from searchParams, validates it with
 * parseAuthorizedPatientSearch, and passes only the normalized term to
 * getMedicalAuthorizedPatients. Queries only active (revoked_at is null)
 * authorizations directed to the caller's own verified identity via
 * `public.get_medical_authorized_patients` -- never a broader patient
 * directory. That RPC also returns each authorized patient's latest PEF
 * and latest recorded_at (Issue 109) and no other health fields.
 */
export default async function EquipeMedicaPacientesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const searchTerm = parseAuthorizedPatientSearch(
    params[AUTHORIZED_PATIENT_SEARCH_PARAM]
  );

  const supabase = await createClient();
  const session = await readMedicalTeamSession(supabase);

  if (session.status === "unauthenticated") {
    redirect("/login");
  }

  const result = await getMedicalAuthorizedPatients(supabase, searchTerm);

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

      <AuthorizedPatientSearch key={searchTerm} searchTerm={searchTerm} />

      <AppAlert variant="info">
        O paciente autorizou o acesso em modo somente leitura.
      </AppAlert>

      {result.status === "unavailable" && (
        <AuthorizedPatientsUnavailableState />
      )}

      {result.status === "empty" && <AuthorizedPatientsEmptyState />}

      {result.status === "no-results" && (
        <AuthorizedPatientsNoResultsState />
      )}

      {result.status === "ready" && (
        <>
          {searchTerm.length > 0 ? (
            <div className="min-w-0">
              <h2 className="break-words text-sm font-medium text-[var(--at-text-primary)]">
                Resultados para “{searchTerm}”
              </h2>
              <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
                {formatAuthorizedPatientSearchCount(result.patients.length)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--at-text-secondary)]">
              {formatAuthorizedPatientCount(result.patients.length)}
            </p>
          )}
          <AuthorizedPatientList patients={result.patients} />
        </>
      )}
    </div>
  );
}
