import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { REPORT_PERIOD_PARAM } from "@/features/reports/constants";
import { parseReportPeriod } from "@/features/reports/lib/parse-report-period";
import {
  getMedicalAuthorizedPatientReportData,
  MedicalPatientReportPageContent,
  parseMedicalPatientId,
  readMedicalTeamSession,
} from "@/features/medical-team";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Relatório do paciente",
};

// One authorized patient's private report, resolved fresh per request.
// Never statically generated and never served from a shared public cache.
export const dynamic = "force-dynamic";

/**
 * Protected, read-only medical report for one actively authorized patient
 * (Issue 112).
 *
 * Route: /equipe-medica/pacientes/[patientId]/relatorio
 *
 * The parent /equipe-medica layout already verifies authentication and the
 * persisted medical role, and already renders MedicalTeamShell. This page
 * re-validates patientId, re-checks the request identity, and loads the
 * report only through the Issue 110 authorization-checked RPCs and the
 * patient report's period and calculation helpers. It does not render the
 * patient report route and does not offer print, PDF or sharing.
 */
export default async function EquipeMedicaPacienteRelatorioPage({
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
  const currentPeriod = parseReportPeriod(query[REPORT_PERIOD_PARAM]);

  const supabase = await createClient();
  const session = await readMedicalTeamSession(supabase);

  if (session.status === "unauthenticated") {
    redirect("/login");
  }

  const result = await getMedicalAuthorizedPatientReportData(
    supabase,
    patientId,
    currentPeriod
  );

  if (result.status === "inaccessible") {
    notFound();
  }

  return (
    <MedicalPatientReportPageContent
      patientId={patientId}
      currentPeriod={currentPeriod}
      result={result}
    />
  );
}
