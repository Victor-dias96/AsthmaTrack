import Link from "next/link";
import { AUTHORIZED_PATIENTS_PATH } from "../constants/authorized-patients";

const clearActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

/**
 * Filtered-empty state: the medical-team member has active authorizations,
 * but none of those authorized patient names match the current search
 * (Issue 108). Distinct from zero authorizations and from an unavailable
 * query. Never discloses whether the same name exists outside the
 * caller's authorized set.
 */
export function AuthorizedPatientsNoResultsState() {
  return (
    <div className="rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-border)] bg-[var(--at-surface-input)] p-4 text-center">
      <h2 className="text-sm font-semibold text-[var(--at-text-primary)]">
        Nenhum paciente encontrado
      </h2>
      <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
        Não encontramos pacientes autorizados com esse nome.
      </p>
      <div className="mt-4">
        <Link href={AUTHORIZED_PATIENTS_PATH} className={clearActionClasses}>
          Limpar busca
        </Link>
      </div>
    </div>
  );
}
