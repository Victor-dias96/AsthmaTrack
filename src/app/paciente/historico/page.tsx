import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppAlert } from "@/components/ui/app-alert";
import { HistoryRecordList, loadPatientHistory } from "@/features/history";

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
          <AppAlert variant="warning">
            Não foi possível carregar o histórico.
          </AppAlert>
        ) : result.records.length === 0 ? (
          <div>
            <p className="text-sm text-[var(--at-text-secondary)]">
              Nenhum registro encontrado.
            </p>
            <Link
              href="/paciente/novo-registro"
              className="mt-2 inline-block text-sm font-medium text-[var(--at-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2"
            >
              Adicionar um registro
            </Link>
          </div>
        ) : (
          <HistoryRecordList records={result.records} />
        )}
      </div>
    </PatientShell>
  );
}
