"use client";

import type { SymptomSeverity } from "@/types/daily-record";

import {
  SYMPTOM_FIELDS,
  type SymptomFieldName,
} from "../constants/symptom-severity-options";
import { SymptomSeveritySelector } from "./symptom-severity-selector";

/** Deterministic DOM id derived only from the static field name. */
function toFieldId(name: SymptomFieldName): string {
  return `daily-record-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

type DailyRecordSymptomFieldsProps = {
  severityValues: Record<SymptomFieldName, SymptomSeverity>;
  severityErrors: Record<SymptomFieldName, string | undefined>;
  onSeverityChange: (
    fieldName: SymptomFieldName,
    nextValue: SymptomSeverity
  ) => void;
};

export function DailyRecordSymptomFields({
  severityValues,
  severityErrors,
  onSeverityChange,
}: DailyRecordSymptomFieldsProps) {
  return (
    <div className="mt-4 min-w-0 space-y-4">
      {SYMPTOM_FIELDS.map((field) => (
        <SymptomSeveritySelector
          key={field.name}
          id={toFieldId(field.name)}
          name={field.name}
          label={field.label}
          value={severityValues[field.name]}
          onChange={(nextValue) => onSeverityChange(field.name, nextValue)}
          options={field.options}
          hint={field.hint}
          error={severityErrors[field.name]}
        />
      ))}
    </div>
  );
}
