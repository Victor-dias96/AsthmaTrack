import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { REPORT_DOCUMENT_TITLE } from "@/features/reports/constants";

import {
  getMedicalPatientDashboardPath,
  getMedicalPatientHistoryPath,
} from "../lib/get-medical-patient-history-href";

type MedicalPatientReportHeaderProps = {
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
 * Page header for the medical patient report (Issue 112). The only h1 on
 * the page. Links only to this patient's medical dashboard and history.
 * The patient id is used in those paths and is never rendered.
 */
export function MedicalPatientReportHeader({
  patientId,
  patientName,
}: MedicalPatientReportHeaderProps) {
  return (
    <header className="min-w-0 space-y-2">
      <div className="min-w-0">
        <h1 className="text-xl font-bold break-words text-[var(--at-text-primary)]">
          {REPORT_DOCUMENT_TITLE}
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
          Visualização da equipe médica
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
        <Link
          href={getMedicalPatientHistoryPath(patientId)}
          className={backLinkClasses}
        >
          Ver histórico
        </Link>
      </div>
    </header>
  );
}
