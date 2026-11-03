import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  /** Hides the spinner when a surrounding control already names the busy state. */
  decorative?: boolean;
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
  decorative = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <span
      className={cn(
        "animate-spin rounded-full border-solid border-[var(--at-blue)] border-t-transparent motion-reduce:animate-none",
        sizeMap[size]
      )}
    />
  );

  if (decorative) {
    return (
      <span aria-hidden="true" className={cn("inline-flex", className)}>
        {spinner}
      </span>
    );
  }

  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      {spinner}
    </span>
  );
}
