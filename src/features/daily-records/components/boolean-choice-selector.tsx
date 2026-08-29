"use client";

import { cn } from "@/lib/utils";

type BooleanChoiceOption = {
  value: boolean;
  label: string;
  id: string;
};

type BooleanChoiceSelectorProps = {
  groupName: string;
  label: string;
  labelId: string;
  value: boolean;
  onChange: (value: boolean) => void;
  options: ReadonlyArray<BooleanChoiceOption>;
  hint?: string;
  error?: string;
};

export function BooleanChoiceSelector({
  groupName,
  label,
  labelId,
  value,
  onChange,
  options,
  hint,
  error,
}: BooleanChoiceSelectorProps) {
  const describedBy = error
    ? `${labelId}-error`
    : hint
      ? `${labelId}-hint`
      : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span
        id={labelId}
        className="text-sm font-medium text-[var(--at-text-primary)]"
      >
        {label}
      </span>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className="grid min-w-0 grid-cols-2 gap-2"
      >
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <div key={option.id} className="relative min-w-0">
              <input
                id={option.id}
                type="radio"
                name={groupName}
                value={String(option.value)}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={option.id}
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
          id={`${labelId}-hint`}
          className="text-xs text-[var(--at-text-secondary)]"
        >
          {hint}
        </p>
      )}

      {error && (
        <p
          id={`${labelId}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
