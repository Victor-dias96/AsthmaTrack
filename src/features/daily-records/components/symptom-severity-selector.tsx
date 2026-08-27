"use client";

import { cn } from "@/lib/utils";
import type { SymptomSeverity } from "@/types/daily-record";

import {
  SYMPTOM_SEVERITY_OPTIONS,
  type SymptomSeverityOption,
} from "../constants/symptom-severity-options";

type SymptomSeveritySelectorProps = {
  id: string;
  name: string;
  label: string;
  value: SymptomSeverity;
  onChange: (value: SymptomSeverity) => void;
  options?: ReadonlyArray<SymptomSeverityOption>;
  hint?: string;
  error?: string;
};

export function SymptomSeveritySelector({
  id,
  name,
  label,
  value,
  onChange,
  options = SYMPTOM_SEVERITY_OPTIONS,
  hint,
  error,
}: SymptomSeveritySelectorProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span
        id={`${id}-label`}
        className="text-sm font-medium text-[var(--at-text-primary)]"
      >
        {label}
      </span>

      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const isSelected = value === option.value;

          return (
            <div key={optionId} className="relative min-w-0">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={String(option.value)}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only peer"
              />
              <label
                htmlFor={optionId}
                className={cn(
                  "flex h-11 min-w-0 cursor-pointer items-center justify-center rounded-[var(--at-radius-md)] border px-2 text-center text-sm font-medium transition-colors duration-150",
                  "border-[var(--at-border-input)] bg-[var(--at-surface-input)] text-[var(--at-text-primary)]",
                  "hover:bg-[var(--at-surface)]",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--at-blue)] peer-focus-visible:ring-offset-2",
                  isSelected &&
                    "border-[var(--at-blue)] bg-[var(--at-surface)] ring-1 ring-[var(--at-blue)]"
                )}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>

      {hint && !error && (
        <p
          id={`${id}-hint`}
          className="text-xs text-[var(--at-text-secondary)]"
        >
          {hint}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
