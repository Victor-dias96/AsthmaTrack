"use client";

import { createContext, useContext } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const FormFieldDescriptionContext = createContext<string | undefined>(undefined);

/** Ids of the hint or error rendered by the surrounding FormField. */
export function useFormFieldDescription(): string | undefined {
  return useContext(FormFieldDescriptionContext);
}

export function joinAriaDescribedBy(
  ...values: Array<string | undefined>
): string | undefined {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    for (const id of value.split(/\s+/)) {
      if (!id || seen.has(id)) {
        continue;
      }

      seen.add(id);
      ids.push(id);
    }
  }

  return ids.length > 0 ? ids.join(" ") : undefined;
}

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  labelId?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  labelId,
  className,
  children,
}: FormFieldProps) {
  const description = joinAriaDescribedBy(
    hint && !error ? `${htmlFor}-hint` : undefined,
    error ? `${htmlFor}-error` : undefined
  );

  return (
    <FormFieldDescriptionContext.Provider value={description}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label
          id={labelId}
          htmlFor={htmlFor}
          className="break-words text-sm font-medium text-[var(--at-text-primary)]"
        >
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {children}

        {hint && !error && (
          <p
            id={`${htmlFor}-hint`}
            className="text-xs text-[var(--at-text-secondary)]"
          >
            {hint}
          </p>
        )}

        {error && (
          <FieldError id={`${htmlFor}-error`}>{error}</FieldError>
        )}
      </div>
    </FormFieldDescriptionContext.Provider>
  );
}

export function FieldError({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "flex items-start gap-1.5 text-xs text-destructive",
        className
      )}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
