import { PatientShell } from "@/components/layout/patient-shell";
import { DailyRecordEditFormSkeleton } from "@/features/daily-records/components/daily-record-edit-form-skeleton";

export default function EditDailyRecordLoading() {
  return (
    <PatientShell>
      <div aria-busy="true">
        <p className="sr-only">Carregando registro...</p>
        <div aria-hidden="true">
          <DailyRecordEditFormSkeleton />
        </div>
      </div>
    </PatientShell>
  );
}
