import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  DASHBOARD_PERIOD_PARAM,
  parseDashboardPeriod,
} from "@/features/dashboard";
import { HISTORY_PAGE_PARAM } from "@/features/history/constants";
import { parseHistoryPage } from "@/features/history/lib/parse-history-page";
import {
  getMedicalAuthorizedPatientHistory,
  getMedicalPatientHistoryHref,
  MedicalPatientHistoryPageContent,
  parseMedicalPatientId,
  readMedicalTeamSession,
} from "@/features/medical-team";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Histórico do paciente",
};

// One authorized patient's private history, resolved fresh per request.
// Never statically generated and never served from a shared public cache.
export const dynamic = "force-dynamic";

/**
 * Protected, read-only medical history for one actively authorized patient
 * (Issue 111).
 *
 * Route: /equipe-medica/pacientes/[patientId]/historico
 *
 * The parent /equipe-medica layout already verifies authentication and the
 * persisted medical role, and already renders MedicalTeamShell. This page
 * re-validates patientId, re-checks the request identity, and loads history
 * only through the Issue 110 authorization-checked RPCs.
 */
export default async function EquipeMedicaPacienteHistoricoPage({
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
  const currentPage = parseHistoryPage(query[HISTORY_PAGE_PARAM]);

  const supabase = await createClient();
  const session = await readMedicalTeamSession(supabase);

  if (session.status === "unauthenticated") {
    redirect("/login");
  }

  const result = await getMedicalAuthorizedPatientHistory(
    supabase,
    patientId,
    currentPeriod,
    currentPage
  );

  if (result.status === "inaccessible") {
    notFound();
  }

  if (result.status === "ready" && currentPage > result.totalPages) {
    redirect(
      getMedicalPatientHistoryHref(patientId, currentPeriod, result.totalPages)
    );
  }

  return (
    <MedicalPatientHistoryPageContent
      patientId={patientId}
      currentPeriod={currentPeriod}
      currentPage={currentPage}
      result={result}
    />
  );
}
