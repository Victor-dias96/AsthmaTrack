"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type AppCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: React.ReactNode;
  error?: string;
};

const AppCheckbox = forwardRef<HTMLInputElement, AppCheckboxProps>(
  ({ className, label, id, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className={cn(
            "flex items-start gap-2.5 cursor-pointer text-sm select-none",
            className
          )}
        >
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              "mt-0.5 size-4 shrink-0 rounded border border-[var(--at-border-input)]",
              "accent-[var(--at-blue)] cursor-pointer focus:ring-2 focus:ring-[var(--at-blue)]"
            )}
            {...props}
          />
          <span className="leading-snug text-xs sm:text-sm text-[var(--at-text-secondary)]">
            {label}
          </span>
        </label>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AppCheckbox.displayName = "AppCheckbox";

export { AppCheckbox };
