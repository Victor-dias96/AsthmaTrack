"use client";

import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";

import { PEF_FIELD_ID, RECORDED_AT_FIELD_ID } from "../constants/field-ids";

type DailyRecordMeasurementFieldsProps = {
  recordedAtValue: string;
  recordedAtError?: string;
  isRecordedAtReady: boolean;
  maxRecordedAt?: string;
  onRecordedAtChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRecordedAtBlur: () => void;

  pefValue: string;
  pefError?: string;
  onPefChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPefBlur: () => void;
};

export function DailyRecordMeasurementFields({
  recordedAtValue,
  recordedAtError,
  isRecordedAtReady,
  maxRecordedAt,
  onRecordedAtChange,
  onRecordedAtBlur,
  pefValue,
  pefError,
  onPefChange,
  onPefBlur,
}: DailyRecordMeasurementFieldsProps) {
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
          onChange={onRecordedAtChange}
          onBlur={onRecordedAtBlur}
          max={maxRecordedAt}
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
            onChange={onPefChange}
            onBlur={onPefBlur}
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
