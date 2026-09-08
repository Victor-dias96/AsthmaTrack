import Link from "next/link";
import { UserRoundX } from "lucide-react";

import { AppCard } from "@/components/ui/app-card";
import { AUTHORIZED_PATIENTS_PATH } from "../constants/authorized-patients";

const backLinkClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

/**
 * Single safe "inaccessible" state for the medical patient dashboard route
 * (Issue 110). Rendered via notFound() for every one of: a malformed
 * patientId, a nonexistent patient, a patient who never authorized this
 * caller, an authorization directed to another medical professional, a
 * revoked authorization, or an unsupported target profile role -- no case
 * is ever distinguishable from another from this component alone.
 *
 * Intentionally does NOT render MedicalTeamShell: this component backs
 * src/app/equipe-medica/pacientes/[patientId]/not-found.tsx, whose
 * not-found boundary is nested inside the already-rendered shell from
 * src/app/equipe-medica/layout.tsx. Re-wrapping here would duplicate the
 * sidebar and mobile navigation.
 */
export function MedicalPatientNotFoundState() {
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
          Paciente não encontrado
        </h1>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Não foi possível acessar este paciente.
        </p>
      </div>

      <AppCard className="min-w-0">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--at-surface-input)]"
              aria-hidden="true"
            >
              <UserRoundX
                className="size-5 text-[var(--at-text-secondary)]"
                strokeWidth={1.75}
              />
            </div>
            <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
              Volte para a lista de pacientes autorizados.
            </p>
          </div>
          <Link href={AUTHORIZED_PATIENTS_PATH} className={backLinkClasses}>
            Voltar para pacientes
          </Link>
        </div>
      </AppCard>
    </div>
  );
}
