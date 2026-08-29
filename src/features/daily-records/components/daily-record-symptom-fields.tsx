"use client";

import { useState } from "react";
import { dailyRecordFormSchema } from "@/schemas/daily-record";
import type { SymptomSeverity } from "@/types/daily-record";

import {
  SYMPTOM_FIELDS,
  type SymptomFieldName,
} from "../constants/symptom-severity-options";
import { SymptomSeveritySelector } from "./symptom-severity-selector";

type SeverityValues = Record<SymptomFieldName, SymptomSeverity>;
type SeverityErrors = Record<SymptomFieldName, string | undefined>;

/** Deterministic initial values: every symptom starts at 0, never undefined. */
function createInitialSeverityValues(): SeverityValues {
  return SYMPTOM_FIELDS.reduce((values, field) => {
    values[field.name] = 0;
    return values;
  }, {} as SeverityValues);
}

function createInitialSeverityErrors(): SeverityErrors {
  return SYMPTOM_FIELDS.reduce((errors, field) => {
    errors[field.name] = undefined;
    return errors;
  }, {} as SeverityErrors);
}

/** Deterministic DOM id derived only from the static field name. */
function toFieldId(name: SymptomFieldName): string {
  return `daily-record-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

export function DailyRecordSymptomFields() {
  const [severityValues, setSeverityValues] = useState<SeverityValues>(
    createInitialSeverityValues
  );
  const [severityErrors, setSeverityErrors] = useState<SeverityErrors>(
    createInitialSeverityErrors
  );

  function handleSeverityChange(
    fieldName: SymptomFieldName,
    nextValue: SymptomSeverity
  ) {
    setSeverityValues((previous) => ({ ...previous, [fieldName]: nextValue }));

    const result = dailyRecordFormSchema.shape[fieldName].safeParse(nextValue);

    setSeverityErrors((previous) => ({
      ...previous,
      [fieldName]: result.success
        ? undefined
        : result.error.issues[0]?.message,
    }));
  }

  return (
    <div className="mt-4 min-w-0 space-y-4">
      {SYMPTOM_FIELDS.map((field) => (
        <SymptomSeveritySelector
          key={field.name}
          id={toFieldId(field.name)}
          name={field.name}
          label={field.label}
          value={severityValues[field.name]}
          onChange={(nextValue) => handleSeverityChange(field.name, nextValue)}
          options={field.options}
          hint={field.hint}
          error={severityErrors[field.name]}
        />
      ))}
    </div>
  );
}
