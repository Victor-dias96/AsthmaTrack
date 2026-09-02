import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import {
  REPORT_PERIOD_PARAM,
  ReportEmptyState,
  ReportPageHeader,
  ReportPeriodSelector,
  ReportPeriodSummary,
  ReportUnavailableState,
  getPatientReportData,
  parseReportPeriod,
  readPatientReportSession,
} from "@/features/reports";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Relatório",
};

// Patient report data is private and per-request; never let it be served
// from a cached shell after a mutation on another route.
export const dynamic = "force-dynamic";

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const currentPeriod = parseReportPeriod(params[REPORT_PERIOD_PARAM]);

  const supabase = await createClient();
  const session = await readPatientReportSession(supabase);

  if (session.status === "unauthenticated") {
    redirect("/login");
  }

  const result = await getPatientReportData(
    supabase,
    session.userId,
    currentPeriod
  );

  return (
    <PatientShell>
      <div className="min-w-0 space-y-6">
        <ReportPageHeader />
        <ReportPeriodSelector currentPeriod={currentPeriod} />

        {result.status === "unavailable" ? (
          <ReportUnavailableState />
        ) : result.status === "empty" ? (
          <ReportEmptyState />
        ) : (
          <ReportPeriodSummary
            period={currentPeriod}
            displayStart={result.data.displayStart}
            displayEnd={result.data.displayEnd}
            recordCount={result.data.recordCount}
          />
        )}
      </div>
    </PatientShell>
  );
}
