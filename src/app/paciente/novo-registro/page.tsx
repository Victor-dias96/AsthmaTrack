import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { DailyRecordFormShell } from "@/features/daily-records";

export const metadata: Metadata = {
  title: "Novo registro",
};

export default function NovoRegistroPage() {
  return (
    <PatientShell>
      <DailyRecordFormShell />
    </PatientShell>
  );
}
