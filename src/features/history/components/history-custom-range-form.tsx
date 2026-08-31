import Form from "next/form";
import Link from "next/link";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";

import {
  HISTORY_CUSTOM_PERIOD_PARAM,
  HISTORY_DEFAULT_PERIOD,
  HISTORY_PATH,
} from "../constants";
import type { HistoryFilterCustomErrors } from "../lib/parse-history-filter";

const INICIO_FIELD_ID = "history-custom-inicio";
const FIM_FIELD_ID = "history-custom-fim";
const FORM_ERROR_ID = "history-custom-range-error";

const cancelActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

type HistoryCustomRangeFormProps = {
  startValue: string;
  endValue: string;
  errors?: HistoryFilterCustomErrors;
};

export function HistoryCustomRangeForm({
  startValue,
  endValue,
  errors,
}: HistoryCustomRangeFormProps) {
  const formError = errors?.formError;
  const inicioError = errors?.inicioError;
  const fimError = errors?.fimError;
  const inicioInvalid = Boolean(inicioError) || Boolean(errors?.inicioInvalid);
  const fimInvalid = Boolean(fimError) || Boolean(errors?.fimInvalid);

  const inicioDescribedBy = inicioError
    ? `${INICIO_FIELD_ID}-error`
    : formError
      ? FORM_ERROR_ID
      : undefined;

  const fimDescribedBy = fimError
    ? `${FIM_FIELD_ID}-error`
    : formError
      ? FORM_ERROR_ID
      : undefined;

  return (
    <Form
      action={HISTORY_PATH}
      noValidate
      aria-label="Período personalizado"
      aria-describedby={formError ? FORM_ERROR_ID : undefined}
      className="mt-4 min-w-0"
    >
      <input
        type="hidden"
        name="periodo"
        value={HISTORY_CUSTOM_PERIOD_PARAM}
      />

      {formError ? (
        <p
          id={FORM_ERROR_ID}
          role="alert"
          className="mb-3 text-xs text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Data inicial"
          htmlFor={INICIO_FIELD_ID}
          error={inicioError}
          required
          className="min-w-0"
        >
          <AppInput
            id={INICIO_FIELD_ID}
            name="inicio"
            type="date"
            defaultValue={startValue}
            required
            hasError={inicioInvalid}
            aria-invalid={inicioInvalid}
            aria-describedby={inicioDescribedBy}
            className="min-w-0 max-w-full"
          />
        </FormField>

        <FormField
          label="Data final"
          htmlFor={FIM_FIELD_ID}
          error={fimError}
          required
          className="min-w-0"
        >
          <AppInput
            id={FIM_FIELD_ID}
            name="fim"
            type="date"
            defaultValue={endValue}
            required
            hasError={fimInvalid}
            aria-invalid={fimInvalid}
            aria-describedby={fimDescribedBy}
            className="min-w-0 max-w-full"
          />
        </FormField>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <AppButton type="submit" className="w-full sm:w-auto">
          Aplicar período
        </AppButton>
        <Link
          href={`${HISTORY_PATH}?periodo=${HISTORY_DEFAULT_PERIOD}`}
          className={cancelActionClasses}
        >
          Cancelar
        </Link>
      </div>
    </Form>
  );
}
