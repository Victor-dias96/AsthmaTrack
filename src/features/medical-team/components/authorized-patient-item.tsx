import { ShieldCheck } from "lucide-react";

import { formatAuthorizedAt } from "../lib/format-authorized-at";
import type { MedicalAuthorizedPatient } from "../types/medical-authorized-patient";

type AuthorizedPatientItemProps = {
  patient: MedicalAuthorizedPatient;
};

/**
 * One patient linked through an active authorization directed to the
 * authenticated medical-team professional (Issue 107). Presentational
 * only -- no Supabase query, no authentication, no mutation, no clickable
 * card, and no patient or authorization identifier is ever rendered.
 * Mirrors
 * src/features/access-authorizations/components/active-access-item.tsx,
 * without its patient-only revoke action (medical-team users cannot
 * create, update or revoke authorizations) and without any clinical data
 * (Issue 109 owns latest PEF and latest record date).
 */
export function AuthorizedPatientItem({ patient }: AuthorizedPatientItemProps) {
  const formattedAuthorizedAt = formatAuthorizedAt(patient.authorizedAt);

  return (
    <li className="min-w-0 rounded-[var(--at-radius-md)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4">
      <p className="min-w-0 break-words text-sm font-semibold text-[var(--at-text-primary)]">
        {patient.patientName}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--at-text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} className="shrink-0" aria-hidden="true" />
          Acesso ativo
        </span>
        <span aria-hidden="true">·</span>
        <span>Somente leitura</span>
      </div>

      <p className="mt-2 break-words text-sm text-[var(--at-text-secondary)]">
        Acesso autorizado em{" "}
        {formattedAuthorizedAt ? (
          <time dateTime={patient.authorizedAt}>{formattedAuthorizedAt}</time>
        ) : (
          "data indisponível"
        )}
      </p>
    </li>
  );
}
