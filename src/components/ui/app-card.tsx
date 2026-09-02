import { cn } from "@/lib/utils";

type AppCardProps = {
  className?: string;
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function AppCard({
  className,
  children,
  padding = "md",
}: AppCardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--at-radius-lg)] bg-[var(--at-surface)] border border-[var(--at-border)]",
        "shadow-[var(--at-shadow-sm)]",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

type AppCardHeaderProps = {
  title: string;
  description?: string;
  titleId?: string;
  descriptionId?: string;
  className?: string;
};

export function AppCardHeader({
  title,
  description,
  titleId,
  descriptionId,
  className,
}: AppCardHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      <h2
        id={titleId}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        {title}
      </h2>
      {description && (
        <p
          id={descriptionId}
          className="mt-0.5 text-sm text-[var(--at-text-secondary)]"
        >
          {description}
        </p>
      )}
    </div>
  );
}
