import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import type { CalendarDate } from "@/features/history/lib/parse-calendar-date";
import {
  REPORT_PERIOD_PARAM,
  ReportEmptyState,
  ReportHeader,
  ReportPageHeader,
  ReportPefSummary,
  ReportPeriodSelector,
  ReportPeriodSummary,
  ReportUnavailableState,
  calculatePefSummary,
  formatReportGeneratedAt,
  getPatientReportData,
  getPatientReportProfile,
  isUsableReportCalendarDate,
  parseReportPeriod,
  readPatientReportSession,
  type PatientReportDataResult,
  type ReportPeriod,
} from "@/features/reports";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Relatório",
};

// Patient report data is private and per-request; never let it be served
// from a cached shell after a mutation on another route.
export const dynamic = "force-dynamic";

function RelatorioPageFrame({
  currentPeriod,
  children,
}: {
  currentPeriod: ReportPeriod;
  children: React.ReactNode;
}) {
  return (
    <PatientShell>
      <div className="min-w-0 space-y-6">
        <ReportPageHeader />
        <ReportPeriodSelector currentPeriod={currentPeriod} />
        {children}
      </div>
    </PatientShell>
  );
}

function getVisibleReportDates(
  result: Exclude<PatientReportDataResult, { status: "unavailable" }>
): { displayStart: CalendarDate; displayEnd: CalendarDate } {
  if (result.status === "ready") {
    return {
      displayStart: result.data.displayStart,
      displayEnd: result.data.displayEnd,
    };
  }

  return {
    displayStart: result.displayStart,
    displayEnd: result.displayEnd,
  };
}

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

  const generatedAt = new Date();
  const generated = formatReportGeneratedAt(generatedAt);

  if (generated === null) {
    return (
      <RelatorioPageFrame currentPeriod={currentPeriod}>
        <ReportUnavailableState />
      </RelatorioPageFrame>
    );
  }

  const [profileResult, reportResult] = await Promise.all([
    getPatientReportProfile(supabase, session.userId),
    getPatientReportData(
      supabase,
      session.userId,
      currentPeriod,
      generatedAt
    ),
  ]);

  if (
    profileResult.status === "unavailable" ||
    reportResult.status === "unavailable"
  ) {
    return (
      <RelatorioPageFrame currentPeriod={currentPeriod}>
        <ReportUnavailableState />
      </RelatorioPageFrame>
    );
  }

  const { displayStart, displayEnd } = getVisibleReportDates(reportResult);

  if (
    !isUsableReportCalendarDate(displayStart) ||
    !isUsableReportCalendarDate(displayEnd)
  ) {
    return (
      <RelatorioPageFrame currentPeriod={currentPeriod}>
        <ReportUnavailableState />
      </RelatorioPageFrame>
    );
  }

  return (
    <RelatorioPageFrame currentPeriod={currentPeriod}>
      <ReportHeader
        patientName={profileResult.fullName}
        period={currentPeriod}
        displayStart={displayStart}
        displayEnd={displayEnd}
        generatedAtIso={generated.iso}
        generatedAtLabel={generated.label}
      />

      {reportResult.status === "empty" ? (
        <ReportEmptyState />
      ) : (
        <>
          <ReportPeriodSummary
            period={currentPeriod}
            displayStart={displayStart}
            displayEnd={displayEnd}
            recordCount={reportResult.data.recordCount}
          />
          <ReportPefSummary
            summary={calculatePefSummary(reportResult.data.records)}
          />
        </>
      )}
    </RelatorioPageFrame>
  );
}
