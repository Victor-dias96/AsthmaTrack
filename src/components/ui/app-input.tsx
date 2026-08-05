"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type AppInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ className, type, hasError, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;

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
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-destructive focus:ring-destructive",
            isPassword && "pr-10",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--at-text-secondary)] hover:text-[var(--at-text-primary)] transition-colors"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    );
  }
);

AppInput.displayName = "AppInput";

export { AppInput };
