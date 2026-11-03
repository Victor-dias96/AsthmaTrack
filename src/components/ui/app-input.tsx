"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  joinAriaDescribedBy,
  useFormFieldDescription,
} from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

type AppInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  /** Distinguishes repeated password buttons, for example "confirmação da senha". */
  passwordToggleName?: string;
};

const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  (
    {
      className,
      type,
      hasError,
      passwordToggleName,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const fieldDescription = useFormFieldDescription();
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;
    const describedBy = joinAriaDescribedBy(ariaDescribedBy, fieldDescription);
    const invalid =
      ariaInvalid !== undefined ? ariaInvalid : hasError ? true : undefined;
    const toggleSubject = passwordToggleName ?? "senha";

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={resolvedType}
          className={cn(
            "h-11 w-full rounded-[var(--at-radius-md)] border px-3 py-2 text-sm",
            "bg-[var(--at-surface-input)] text-[var(--at-text-primary)]",
            "placeholder:text-[var(--at-text-placeholder)]",
            "border-[var(--at-border-input)]",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[var(--at-blue)] focus:ring-offset-0 focus:border-[var(--at-blue)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--at-disabled)] disabled:text-[var(--at-disabled-foreground)] disabled:opacity-100",
            hasError && "border-destructive focus:ring-destructive",
            isPassword && "pr-10",
            className
          )}
          {...props}
          aria-describedby={describedBy}
          aria-invalid={invalid}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[var(--at-radius-sm)] text-[var(--at-text-secondary)] outline-none transition-colors hover:text-[var(--at-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2"
            aria-pressed={showPassword}
            aria-label={
              showPassword ? `Ocultar ${toggleSubject}` : `Mostrar ${toggleSubject}`
            }
          >
            {showPassword ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    );
  }
);

AppInput.displayName = "AppInput";

export { AppInput };
