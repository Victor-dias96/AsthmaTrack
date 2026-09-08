import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  DASHBOARD_PERIOD_PARAM,
  parseDashboardPeriod,
} from "@/features/dashboard";
import {
  getMedicalAuthorizedPatientDashboardData,
  MedicalPatientDashboardPageContent,
  parseMedicalPatientId,
  readMedicalTeamSession,
} from "@/features/medical-team";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard do paciente",
};

// Contains one authorized patient's private health data, resolved fresh
// per request against the caller's current authorization state. Never
// statically generated and never served from a shared public cache --
// mirrors src/app/paciente/dashboard/page.tsx and
// src/app/equipe-medica/pacientes/page.tsx.
export const dynamic = "force-dynamic";

/**
 * Protected, read-only medical dashboard for one actively authorized
 * patient (Issue 110).
 *
 * Route: /equipe-medica/pacientes/[patientId] -- patientId is the existing
 * internal patient profile ID, used only as an untrusted lookup input,
 * never as proof of authorization and never rendered.
 *
 * Layering (smallest secure extension over the established Issue 106-109
 * architecture):
 *  1. src/app/equipe-medica/layout.tsx (already applied to every route in
 *     this subtree) verifies authentication and the caller's persisted
 *     medical role before this page ever renders, and already renders
 *     MedicalTeamShell -- this page never re-renders the shell, sidebar or
 *     mobile navigation, and never uses the patient layout.
 *  2. This page validates the dynamic patientId with the same UUID-parser
 *     convention as src/features/history/lib/parse-daily-record-id.ts and
 *     src/features/access-authorizations/lib/parse-access-authorization-id.ts
 *     *before* any Supabase call -- a malformed value resolves through
 *     notFound() without ever querying daily_records, mirroring
 *     src/app/paciente/historico/[id]/page.tsx.
 *  3. This page re-verifies the request-bound authenticated identity via
 *     readMedicalTeamSession, the same established convention already used
 *     by src/app/equipe-medica/pacientes/page.tsx (a Server Component
 *     boundary re-verifies identity rather than trusting data implicitly
 *     passed down from an ancestor layout).
 *  4. getMedicalAuthorizedPatientDashboardData enforces, in the database,
 *     on every request: the caller's persisted medical role, an active
 *     (revoked_at is null) authorization from patientId to the caller's
 *     own auth.uid(), and that the target is a persisted patient profile.
 *     A revoked, nonexistent, never-authorized, or role-mismatched target
 *     all collapse into the same "inaccessible" result, resolved here
 *     through the same notFound() used for a malformed ID -- no case can
 *     be distinguished from the outside.
 *
 * Nothing here ever creates a patient session, impersonates the patient,
 * or changes the authenticated identity. No write action exists anywhere
 * in this render tree.
 */
export default async function EquipeMedicaPacienteDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const routeParams = await params;
  const patientId = parseMedicalPatientId(routeParams.patientId);

  if (patientId === null) {
    notFound();
  }

  const query = await searchParams;
  const currentPeriod = parseDashboardPeriod(query[DASHBOARD_PERIOD_PARAM]);

  const supabase = await createClient();
  const session = await readMedicalTeamSession(supabase);

  if (session.status === "unauthenticated") {
    redirect("/login");
  }

  const result = await getMedicalAuthorizedPatientDashboardData(
    supabase,
    patientId,
    currentPeriod
  );

  if (result.status === "inaccessible") {
    notFound();
  }

  return (
    <MedicalPatientDashboardPageContent
      patientId={patientId}
      currentPeriod={currentPeriod}
      result={result}
    />
  );
}
