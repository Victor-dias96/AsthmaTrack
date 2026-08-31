"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DailyRecordNotFoundState } from "@/features/history/components/daily-record-not-found-state";
import { cn } from "@/lib/utils";

import { useDailyRecordEditForm } from "../hooks/use-daily-record-edit-form";
import {
  DAILY_RECORD_OFFLINE_INDICATOR_MESSAGE,
  DAILY_RECORD_UPDATE_SUCCESS_MESSAGE,
} from "../lib/classify-daily-record-submit-error";
import type { DailyRecordEditFormInitialValues } from "../lib/map-daily-record-to-edit-form-values";
import { DailyRecordFormFields } from "./daily-record-form-fields";

const outlineActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

type DailyRecordEditFormProps = {
  recordId: string;
  detailsHref: string;
  initialValues: DailyRecordEditFormInitialValues;
};

export function DailyRecordEditForm({
  recordId,
  detailsHref,
  initialValues,
}: DailyRecordEditFormProps) {
  const form = useDailyRecordEditForm({
    recordId,
    detailsHref,
    initialValues,
  });
  const [isBrowserOffline, setIsBrowserOffline] = useState(false);
  const isSubmitting = form.submissionState === "submitting";
  const isSaveDisabled =
    form.submissionState === "submitting" ||
    form.submissionState === "success" ||
    form.submissionState === "not-found";
  const showOfflineIndicator =
    isBrowserOffline && form.submissionState !== "success";

  useEffect(() => {
    function handleOffline() {
      setIsBrowserOffline(true);
    }

    function handleOnline() {
      setIsBrowserOffline(false);
    }

    const timeoutId = window.setTimeout(() => {
      setIsBrowserOffline(!window.navigator.onLine);
    }, 0);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (form.submissionState === "not-found") {
    return <DailyRecordNotFoundState />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
          Editar registro
        </h1>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Atualize os dados deste registro de PEF e sintomas.
        </p>
      </header>

      <AppAlert variant="info">
        Preencha as informações com base na sua observação e nas suas medições.
        Este aplicativo não substitui orientação médica profissional.
      </AppAlert>

      {showOfflineIndicator && (
        <AppAlert variant="warning">
          {DAILY_RECORD_OFFLINE_INDICATOR_MESSAGE}
        </AppAlert>
      )}

      <form onSubmit={form.handleSubmit} noValidate aria-busy={isSubmitting}>
        <AppCard>
          <AppCardHeader
            title="Dados do registro"
            description="Informe quando você mediu o PEF e como se sentiu no período."
          />

          <DailyRecordFormFields
            recordedAtValue={form.recordedAtValue}
            recordedAtError={form.recordedAtError}
            isRecordedAtReady={form.isRecordedAtReady}
            maxRecordedAt={form.maxRecordedAt}
            onRecordedAtChange={form.onRecordedAtChange}
            onRecordedAtBlur={form.onRecordedAtBlur}
            pefValue={form.pefValue}
            pefError={form.pefError}
            onPefChange={form.onPefChange}
            onPefBlur={form.onPefBlur}
            severityValues={form.severityValues}
            severityErrors={form.severityErrors}
            onSeverityChange={form.onSeverityChange}
            hadAttack={form.hadAttack}
            hadAttackError={form.hadAttackError}
            onHadAttackChange={form.onHadAttackChange}
            usedRescueMedication={form.usedRescueMedication}
            usedRescueMedicationError={form.usedRescueMedicationError}
            onUsedRescueMedicationChange={form.onUsedRescueMedicationChange}
            notes={form.notes}
            notesError={form.notesError}
            onNotesChange={form.onNotesChange}
            onNotesBlur={form.onNotesBlur}
          />

          <div className="mt-8 border-t border-[var(--at-border)] pt-6">
            {form.submissionState === "success" && (
              <AppAlert variant="success" className="mb-4">
                {DAILY_RECORD_UPDATE_SUCCESS_MESSAGE}
              </AppAlert>
            )}

            {form.formError && (
              <div id="daily-record-edit-form-error">
                <AppAlert variant="warning" className="mb-4">
                  {form.formError}
                </AppAlert>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link href={detailsHref} className={cn(outlineActionClasses)}>
                Cancelar
              </Link>

              <AppButton
                type="submit"
                disabled={isSaveDisabled}
                aria-disabled={isSaveDisabled}
                aria-busy={isSubmitting}
                aria-describedby={
                  form.formError ? "daily-record-edit-form-error" : undefined
                }
                fullWidth
                className="min-w-[10.5rem] sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" label="Salvando" />
                    <span className="ml-2">Salvando...</span>
                  </>
                ) : (
                  "Salvar registro"
                )}
              </AppButton>
            </div>
          </div>
        </AppCard>
      </form>
    </div>
  );
}
