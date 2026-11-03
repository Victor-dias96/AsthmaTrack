import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { DailyRecordNotFoundState } from "@/features/history/components/daily-record-not-found-state";

export const metadata: Metadata = {
  title: "Registro não encontrado",
};

export default function EditDailyRecordNotFound() {
  return (
    <PatientShell>
      <DailyRecordNotFoundState />
    </PatientShell>
  );
}
