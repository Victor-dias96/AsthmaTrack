import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { DashboardPageContent } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PatientShell>
      <DashboardPageContent />
    </PatientShell>
  );
}
