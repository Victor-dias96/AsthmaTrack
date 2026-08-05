import { TriangleAlert, Info, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "warning" | "info" | "success";

type AppAlertProps = {
  variant?: AlertVariant;
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
        className="shrink-0 text-[var(--at-alert-icon)]"
      />
    ),
  },
  info: {
    wrapper:
      "bg-blue-50 border border-blue-200 text-blue-800",
    icon: <Info size={16} className="shrink-0 text-blue-500" />,
  },
  success: {
    wrapper:
      "bg-green-50 border border-green-200 text-green-800",
    icon: <CircleCheck size={16} className="shrink-0 text-green-500" />,
  },
};

export function AppAlert({
  variant = "warning",
  children,
  className,
}: AppAlertProps) {
  const { wrapper, icon } = variantStyles[variant];
  return (
    <div
      role="alert"
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
