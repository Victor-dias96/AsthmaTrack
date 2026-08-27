import Link from "next/link";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";
import { cn } from "@/lib/utils";

import { DailyRecordFormSection } from "./daily-record-form-section";
import { DailyRecordMeasurementFields } from "./daily-record-measurement-fields";
import { DailyRecordSymptomFields } from "./daily-record-symptom-fields";

const outlineActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

export function DailyRecordFormShell() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
          Novo registro
        </h1>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Registre sua medição de PEF e os sintomas observados no dia.
        </p>
      </header>

      <AppAlert variant="info">
        Preencha as informações com base na sua observação e nas suas medições.
        Este aplicativo não substitui orientação médica profissional.
      </AppAlert>

      <AppCard>
        <AppCardHeader
          title="Dados do registro"
          description="Informe quando você mediu o PEF e como se sentiu no período."
        />

        <div
          role="group"
          aria-label="Seções do registro diário"
          className="space-y-8"
        >
          <DailyRecordFormSection
            id="daily-record-section-datetime"
            title="Data e medição"
            description="Data, hora e valor de PEF medido."
          >
            <DailyRecordMeasurementFields />
          </DailyRecordFormSection>

          <DailyRecordFormSection
            id="daily-record-section-symptoms"
            title="Sintomas"
            description="Intensidade dos sintomas que você observou."
            className="border-t border-[var(--at-border)] pt-8"
          >
            <DailyRecordSymptomFields />
          </DailyRecordFormSection>

          <DailyRecordFormSection
            id="daily-record-section-additional"
            title="Informações adicionais"
            description="Crises, uso de medicação de resgate e observações."
            className="border-t border-[var(--at-border)] pt-8"
          />
        </div>

        <div className="mt-8 border-t border-[var(--at-border)] pt-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/paciente/dashboard"
              className={cn(outlineActionClasses)}
            >
              Cancelar
            </Link>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
              <AppButton
                type="button"
                disabled
                aria-describedby="daily-record-save-disabled-reason"
                fullWidth
                className="sm:w-auto"
              >
                Salvar registro
              </AppButton>
              <p
                id="daily-record-save-disabled-reason"
                className="text-xs text-[var(--at-text-secondary)] sm:text-right"
              >
                O salvamento será habilitado quando os campos do formulário
                forem implementados.
              </p>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
