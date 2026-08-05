import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeMap = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-9 border-[3px]",
};

export function LoadingSpinner({
  size = "md",
  className,
  label = "Carregando…",
}: LoadingSpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <span
        className={cn(
          "animate-spin rounded-full border-solid border-[var(--at-blue)] border-t-transparent",
          sizeMap[size]
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
