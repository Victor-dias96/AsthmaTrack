import Link from "next/link";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";

import {
  AUTHORIZED_PATIENT_SEARCH_INPUT_ID,
  AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH,
  AUTHORIZED_PATIENT_SEARCH_PARAM,
  AUTHORIZED_PATIENTS_PATH,
} from "../constants/authorized-patients";

const clearActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

type AuthorizedPatientSearchProps = {
  /**
   * Already-parsed, already-normalized search term from the page
   * searchParams. Empty string means no active search. Never a raw query
   * array, never a patient ID.
   */
  searchTerm: string;
};

/**
 * Native GET name-search for the authorized-patient list (Issue 108).
 * Presentational: no Supabase client, no authorization decision, no
 * keystroke search and no Server Action. Submitting navigates to
 * `/equipe-medica/pacientes?q=...`; clearing uses a Link to the same path
 * without `q`.
 */
export function AuthorizedPatientSearch({
  searchTerm,
}: AuthorizedPatientSearchProps) {
  const hasActiveSearch = searchTerm.length > 0;

  return (
    <form
      action={AUTHORIZED_PATIENTS_PATH}
      method="get"
      className="min-w-0"
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
        <FormField
          label="Buscar paciente"
          htmlFor={AUTHORIZED_PATIENT_SEARCH_INPUT_ID}
          className="min-w-0 flex-1"
        >
          <AppInput
            id={AUTHORIZED_PATIENT_SEARCH_INPUT_ID}
            name={AUTHORIZED_PATIENT_SEARCH_PARAM}
            type="search"
            key={searchTerm}
            defaultValue={searchTerm}
            placeholder="Digite o nome do paciente"
            maxLength={AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH}
            autoComplete="off"
            className="min-w-0 max-w-full"
          />
        </FormField>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <AppButton type="submit" className="w-full sm:w-auto">
            Buscar
          </AppButton>
          {hasActiveSearch ? (
            <Link href={AUTHORIZED_PATIENTS_PATH} className={clearActionClasses}>
              Limpar busca
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}
