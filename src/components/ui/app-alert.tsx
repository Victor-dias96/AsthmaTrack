import { TriangleAlert, Info, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "warning" | "info" | "success";
type AlertAnnouncement = "assertive" | "polite" | "off";

type AppAlertProps = {
  variant?: AlertVariant;
  /**
   * Assertive for urgent failures, polite for routine success, and off for
   * static notices that must not be announced as live regions.
   */
  announcement?: AlertAnnouncement;
  children: React.ReactNode;
  className?: string;
};

const variantStyles: Record<
  AlertVariant,
  { wrapper: string; icon: React.ReactNode }
> = {
  warning: {
    wrapper:
      "bg-[var(--at-alert-bg)] border border-[var(--at-alert-border)] text-[var(--at-alert-text)]",
    icon: (
      <TriangleAlert
        size={16}
        aria-hidden="true"
        className="shrink-0 text-[var(--at-alert-icon)]"
      />
    ),
  },
  info: {
    wrapper:
      "bg-[var(--at-info-bg)] border border-[var(--at-info-border)] text-[var(--at-info-text)]",
    icon: (
      <Info size={16} aria-hidden="true" className="shrink-0 text-[var(--at-info-icon)]" />
    ),
  },
  success: {
    wrapper:
      "bg-[var(--at-success-bg)] border border-[var(--at-success-border)] text-[var(--at-success-text)]",
    icon: (
      <CircleCheck
        size={16}
        aria-hidden="true"
        className="shrink-0 text-[var(--at-success-icon)]"
      />
    ),
  },
};

function defaultAnnouncement(variant: AlertVariant): AlertAnnouncement {
  if (variant === "warning") {
    return "assertive";
  }

  if (variant === "success") {
    return "polite";
  }

  return "off";
}

export function AppAlert({
  variant = "warning",
  announcement,
  children,
  className,
}: AppAlertProps) {
  const { wrapper, icon } = variantStyles[variant];
  const politeness = announcement ?? defaultAnnouncement(variant);
  const liveAttributes =
    politeness === "assertive"
      ? { role: "alert" as const }
      : politeness === "polite"
        ? { role: "status" as const, "aria-live": "polite" as const, "aria-atomic": true }
        : {};

  return (
    <div
      {...liveAttributes}
      className={cn(
        "flex items-start gap-2.5 rounded-[var(--at-radius-md)] px-4 py-3 text-sm leading-relaxed",
        wrapper,
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}
