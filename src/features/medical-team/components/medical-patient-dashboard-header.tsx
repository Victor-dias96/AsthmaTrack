import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { AUTHORIZED_PATIENTS_PATH } from "../constants/authorized-patients";

type MedicalPatientDashboardHeaderProps = {
  /**
   * Already-normalized patient display name, or null when identity
   * resolution did not succeed (the unavailable state) -- never rendered
   * as "Nome não informado" in that case, since that fallback is reserved
   * for a successfully-resolved profile with an empty name.
   */
  patientName: string | null;
};

const backLinkClasses = [
  "inline-flex items-center gap-1.5 text-sm font-medium text-[var(--at-blue)]",
  "rounded-[var(--at-radius-sm)] underline-offset-4 outline-none",
  "hover:underline",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
].join(" ");

/**
 * Page header for the medical patient dashboard (Issue 110). The only h1
 * on the page. Never displays the patient's email, patient ID or
 * authorization ID, and never claims clinical review -- see the
 * requirements in the Issue 110 task description.
 */
export function MedicalPatientDashboardHeader({
  patientName,
}: MedicalPatientDashboardHeaderProps) {
  return (
    <header className="min-w-0 space-y-2">
      <div className="min-w-0">
        <h1 className="text-xl font-bold break-words text-[var(--at-text-primary)]">
          Dashboard do paciente
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
        <Link href={AUTHORIZED_PATIENTS_PATH} className={backLinkClasses}>
          Voltar para pacientes
        </Link>
      </div>
    </header>
  );
}
