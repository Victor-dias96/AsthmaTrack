"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type AppTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[5.5rem] w-full min-w-0 max-w-full rounded-[var(--at-radius-md)] border px-3 py-2 text-sm",
          "bg-[var(--at-surface-input)] text-[var(--at-text-primary)]",
          "placeholder:text-[var(--at-text-placeholder)]",
          "border-[var(--at-border-input)]",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-[var(--at-blue)] focus:ring-offset-0 focus:border-[var(--at-blue)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          hasError && "border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      />
    );
  }
);

AppTextarea.displayName = "AppTextarea";

export { AppTextarea };
