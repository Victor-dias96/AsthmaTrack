import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import {
  HistoryEmptyState,
  HistoryErrorState,
  HistoryRecordList,
  loadPatientHistory,
} from "@/features/history";

export const metadata: Metadata = {
  title: "Histórico",
};

export default async function HistoricoPage() {
  const result = await loadPatientHistory();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <PatientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Histórico
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Consulte os registros de PEF e sintomas que você salvou
            anteriormente.
          </p>
        </div>

        {result.status === "error" ? (
          <HistoryErrorState />
        ) : result.records.length === 0 ? (
          <HistoryEmptyState />
        ) : (
          <HistoryRecordList records={result.records} />
        )}
      </div>
    </PatientShell>
  );
}
