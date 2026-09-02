import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import {
  DASHBOARD_PERIOD_PARAM,
  DashboardPageContent,
  loadDashboardGreeting,
  loadPatientDashboardData,
  parseDashboardPeriod,
} from "@/features/dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const currentPeriod = parseDashboardPeriod(params[DASHBOARD_PERIOD_PARAM]);
  const greeting = await loadDashboardGreeting();

  if (greeting.status === "unauthenticated") {
    redirect("/login");
  }

  const supabase = await createClient();
  const dashboardResult = await loadPatientDashboardData(
    supabase,
    greeting.userId,
    currentPeriod
  );

  if (dashboardResult.status !== "ready") {
    return (
      <PatientShell>
        <DashboardPageContent
          firstName={greeting.firstName}
          currentPeriod={currentPeriod}
          contentState={dashboardResult.status}
        />
      </PatientShell>
    );
  }

  const { data } = dashboardResult;

  return (
    <PatientShell>
      <DashboardPageContent
        firstName={greeting.firstName}
        currentPeriod={currentPeriod}
        contentState="ready"
        pefChartData={data.pefChartPoints}
        latestPef={data.latestPef}
        latestRecordDate={data.latestRecordedAt}
        totalRecords={data.totalRecords}
        daysWithSymptoms={data.daysWithSymptoms}
        recordedAttacks={data.recordedAttacks}
        rescueMedicationUsage={data.rescueMedicationUsage}
        recentRecords={data.recentRecords}
        recentRecordsStatus="ready"
      />
    </PatientShell>
  );
}
