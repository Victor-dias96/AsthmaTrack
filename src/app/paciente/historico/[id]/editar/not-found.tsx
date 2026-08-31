import { PatientShell } from "@/components/layout/patient-shell";
import { DailyRecordNotFoundState } from "@/features/history/components/daily-record-not-found-state";

export default function EditDailyRecordNotFound() {
  return (
    <PatientShell>
      <DailyRecordNotFoundState />
    </PatientShell>
  );
}
