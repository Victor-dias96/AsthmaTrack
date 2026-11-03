import { PatientShell } from "@/components/layout/patient-shell";
import { DailyRecordEditFormSkeleton } from "@/features/daily-records/components/daily-record-edit-form-skeleton";

export default function EditDailyRecordLoading() {
  return (
    <PatientShell>
      <div aria-busy="true">
        <h1 className="sr-only">Carregando registro...</h1>
        <div aria-hidden="true">
          <DailyRecordEditFormSkeleton />
        </div>
      </div>
    </PatientShell>
  );
}
