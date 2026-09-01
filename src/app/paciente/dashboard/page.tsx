import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import {
  DashboardPageContent,
  loadDashboardGreeting,
} from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const result = await loadDashboardGreeting();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <PatientShell>
      <DashboardPageContent firstName={result.firstName} />
    </PatientShell>
  );
}
