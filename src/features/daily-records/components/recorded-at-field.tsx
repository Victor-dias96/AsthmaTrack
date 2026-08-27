"use client";

import { useState, useSyncExternalStore } from "react";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";
import { formatDateToDatetimeLocal } from "@/lib/format-datetime-local";
import { dailyRecordFormSchema } from "@/schemas/daily-record";

const FIELD_ID = "daily-record-recorded-at";

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

export function RecordedAtField() {
  const initialLocal = useSyncExternalStore(
    subscribeToDatetimeLocal,
    getClientDatetimeLocalSnapshot,
    getServerDatetimeLocalSnapshot
  );
  const [userValue, setUserValue] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const value = userValue ?? initialLocal;
  const isReady = initialLocal.length > 0;

  function validate(nextValue: string) {
    const result = dailyRecordFormSchema.shape.recordedAt.safeParse(nextValue);

    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }

    setError(undefined);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setUserValue(nextValue);

    if (nextValue) {
      validate(nextValue);
    } else {
      setError(undefined);
    }
  }

  function handleBlur() {
    if (value) {
      validate(value);
    }
  }

  const describedBy = error ? `${FIELD_ID}-error` : `${FIELD_ID}-hint`;

  return (
    <FormField
      label="Data e horário"
      htmlFor={FIELD_ID}
      hint="Momento em que você mediu o PEF e observou os sintomas."
      error={error}
      required
      className="mt-4 min-w-0"
    >
      <AppInput
        id={FIELD_ID}
        name="recordedAt"
        type="datetime-local"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        max={initialLocal || undefined}
        hasError={!!error}
        aria-invalid={!!error}
        aria-describedby={isReady ? describedBy : undefined}
        disabled={!isReady}
        required
        className="min-w-0 max-w-full"
      />
    </FormField>
  );
}
