import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { getMedicalPatientDashboardPath } from "../lib/get-medical-patient-history-href";

type MedicalPatientHistoryHeaderProps = {
  patientId: string;
  patientName: string | null;
};

const backLinkClasses = [
  "inline-flex items-center gap-1.5 text-sm font-medium text-[var(--at-blue)]",
  "rounded-[var(--at-radius-sm)] underline-offset-4 outline-none",
  "hover:underline",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
].join(" ");

/**
 * Page header for the medical patient history (Issue 111). The only h1
 * on the page. Links back only to this patient's medical dashboard.
 */
export function MedicalPatientHistoryHeader({
  patientId,
  patientName,
}: MedicalPatientHistoryHeaderProps) {
  return (
    <header className="min-w-0 space-y-2">
      <div className="min-w-0">
        <h1 className="text-xl font-bold break-words text-[var(--at-text-primary)]">
          Histórico do paciente
        </h1>
        {patientName !== null ? (
          <p className="mt-0.5 min-w-0 break-words text-sm text-[var(--at-text-secondary)]">
            Paciente:{" "}
            <span className="font-medium text-[var(--at-text-primary)]">
              {patientName}
            </span>
          </p>
        ) : null}
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Visualização em modo somente leitura dos registros autorizados.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--at-text-primary)]">
          <ShieldCheck size={14} className="shrink-0" aria-hidden="true" />
          Somente leitura
        </span>
        <Link
          href={getMedicalPatientDashboardPath(patientId)}
          className={backLinkClasses}
        >
          Voltar para o dashboard
        </Link>
      </div>
    </header>
  );
}
