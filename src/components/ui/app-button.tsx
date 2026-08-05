"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "link" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--at-blue)] text-white font-semibold",
    "hover:bg-[var(--at-blue-hover)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
    "active:translate-y-px",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "transition-all duration-150",
  ].join(" "),
  outline: [
    "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
    "hover:bg-[var(--at-surface-input)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
    "active:translate-y-px",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "transition-all duration-150",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--at-text-secondary)] font-medium",
    "hover:bg-[var(--at-surface-input)] hover:text-[var(--at-text-primary)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
    "transition-all duration-150",
  ].join(" "),
  link: [
    "bg-transparent text-[var(--at-blue)] font-medium underline-offset-4",
    "hover:underline",
    "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
    "transition-all duration-150",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-[var(--at-radius-sm)]",
  md: "h-10 px-4 text-sm rounded-[var(--at-radius-md)]",
  lg: "h-12 px-5 text-base rounded-[var(--at-radius-md)]",
};

const AppButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", fullWidth, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);

AppButton.displayName = "AppButton";

export { AppButton };
export type { ButtonVariant, ButtonSize };
