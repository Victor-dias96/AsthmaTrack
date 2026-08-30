import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-[var(--at-radius-sm)] bg-[var(--at-surface-input)]",
        "motion-safe:animate-pulse",
        className
      )}
    />
  );
}
