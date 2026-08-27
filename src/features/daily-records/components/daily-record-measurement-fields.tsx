"use client";

import { useState, useSyncExternalStore } from "react";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";
import { formatDateToDatetimeLocal } from "@/lib/format-datetime-local";
import { dailyRecordFormSchema } from "@/schemas/daily-record";

const RECORDED_AT_FIELD_ID = "daily-record-recorded-at";
const PEF_FIELD_ID = "daily-record-pef-value";

let clientDatetimeLocalSnapshot: string | null = null;

function subscribeToDatetimeLocal(): () => void {
  return () => {};
}

function getClientDatetimeLocalSnapshot(): string {
  if (clientDatetimeLocalSnapshot === null) {
    clientDatetimeLocalSnapshot = formatDateToDatetimeLocal(new Date());
  }

  return clientDatetimeLocalSnapshot;
}

function getServerDatetimeLocalSnapshot(): string {
  return "";
}

export function DailyRecordMeasurementFields() {
  const initialLocal = useSyncExternalStore(
    subscribeToDatetimeLocal,
    getClientDatetimeLocalSnapshot,
    getServerDatetimeLocalSnapshot
  );
  const [recordedAtUserValue, setRecordedAtUserValue] = useState<string | null>(
    null
  );
  const [recordedAtError, setRecordedAtError] = useState<string | undefined>(
    undefined
  );
  const [pefValue, setPefValue] = useState("");
  const [pefError, setPefError] = useState<string | undefined>(undefined);

  const recordedAtValue = recordedAtUserValue ?? initialLocal;
  const isRecordedAtReady = initialLocal.length > 0;

  function validateRecordedAt(nextValue: string) {
    const result = dailyRecordFormSchema.shape.recordedAt.safeParse(nextValue);

    if (!result.success) {
      setRecordedAtError(result.error.issues[0]?.message);
      return;
    }

    setRecordedAtError(undefined);
  }

  function handleRecordedAtChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setRecordedAtUserValue(nextValue);

    if (nextValue) {
      validateRecordedAt(nextValue);
    } else {
      setRecordedAtError(undefined);
    }
  }

  function handleRecordedAtBlur() {
    if (recordedAtValue) {
      validateRecordedAt(recordedAtValue);
    }
  }

  function validatePef(nextValue: string) {
    const result = dailyRecordFormSchema.shape.pefValue.safeParse(nextValue);

    if (!result.success) {
      setPefError(result.error.issues[0]?.message);
      return;
    }

    setPefError(undefined);
  }

  function handlePefChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setPefValue(nextValue);

    if (nextValue) {
      validatePef(nextValue);
    } else {
      setPefError(undefined);
    }
  }

  function handlePefBlur() {
    validatePef(pefValue);
  }

  const recordedAtDescribedBy = recordedAtError
    ? `${RECORDED_AT_FIELD_ID}-error`
    : `${RECORDED_AT_FIELD_ID}-hint`;

  const pefDescribedBy = pefError
    ? `${PEF_FIELD_ID}-error`
    : `${PEF_FIELD_ID}-hint ${PEF_FIELD_ID}-unit`;

  return (
    <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        label="Data e horário"
        htmlFor={RECORDED_AT_FIELD_ID}
        hint="Momento em que você mediu o PEF e observou os sintomas."
        error={recordedAtError}
        required
        className="min-w-0"
      >
        <AppInput
          id={RECORDED_AT_FIELD_ID}
          name="recordedAt"
          type="datetime-local"
          value={recordedAtValue}
          onChange={handleRecordedAtChange}
          onBlur={handleRecordedAtBlur}
          max={initialLocal || undefined}
          hasError={!!recordedAtError}
          aria-invalid={!!recordedAtError}
          aria-describedby={
            isRecordedAtReady ? recordedAtDescribedBy : undefined
          }
          disabled={!isRecordedAtReady}
          required
          className="min-w-0 max-w-full"
        />
      </FormField>

      <FormField
        label="Pico de Fluxo Expiratório (PEF)"
        htmlFor={PEF_FIELD_ID}
        hint="Informe o valor exibido no seu medidor de pico de fluxo."
        error={pefError}
        required
        className="min-w-0"
      >
        <div className="relative min-w-0 w-full">
          <AppInput
            id={PEF_FIELD_ID}
            name="pefValue"
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            value={pefValue}
            onChange={handlePefChange}
            onBlur={handlePefBlur}
            hasError={!!pefError}
            aria-invalid={!!pefError}
            aria-describedby={pefDescribedBy}
            required
            className="min-w-0 max-w-full pr-14 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span
            id={`${PEF_FIELD_ID}-unit`}
            className="sr-only"
          >
            Litros por minuto
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[var(--at-text-secondary)]"
          >
            L/min
          </span>
        </div>
      </FormField>
    </div>
  );
}
