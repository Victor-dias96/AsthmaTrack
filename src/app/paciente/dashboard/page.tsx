import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import {
  DASHBOARD_PERIOD_PARAM,
  DashboardPageContent,
  loadDashboardGreeting,
  parseDashboardPeriod,
} from "@/features/dashboard";

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
  const result = await loadDashboardGreeting();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <PatientShell>
      <DashboardPageContent
        firstName={result.firstName}
        currentPeriod={currentPeriod}
      />
    </PatientShell>
  );
}
