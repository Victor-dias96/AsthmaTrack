import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import { DailyRecordEditForm } from "@/features/daily-records/components/daily-record-edit-form";
import { mapDailyRecordToEditFormValues } from "@/features/daily-records/lib/map-daily-record-to-edit-form-values";
import {
  DailyRecordDetailsErrorState,
  getDailyRecordHref,
  loadPatientDailyRecord,
  parseDailyRecordIdParam,
} from "@/features/history";
import { HISTORY_PATH } from "@/features/history/constants";

export const metadata: Metadata = {
  title: "Editar registro",
};

export const dynamic = "force-dynamic";

export default async function EditDailyRecordPage({
  params,
}: {
  params: Promise<{ id: string | string[] }>;
}) {
  const routeParams = await params;
  const recordId = parseDailyRecordIdParam(routeParams.id);

  if (recordId === null) {
    notFound();
  }

  const result = await loadPatientDailyRecord(recordId);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <PatientShell>
        <EditRecordErrorState />
      </PatientShell>
    );
  }

  const initialValues = mapDailyRecordToEditFormValues(result.record);

  if (initialValues === null) {
    return (
      <PatientShell>
        <EditRecordErrorState />
      </PatientShell>
    );
  }

  return (
    <PatientShell>
      <DailyRecordEditForm
        recordId={recordId}
        detailsHref={getDailyRecordHref(recordId)}
        initialValues={initialValues}
      />
    </PatientShell>
  );
}

function EditRecordErrorState() {
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
          Editar registro
        </h1>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Atualize os dados deste registro de PEF e sintomas.
        </p>
      </div>
      <DailyRecordDetailsErrorState historyHref={HISTORY_PATH} />
    </div>
  );
}
