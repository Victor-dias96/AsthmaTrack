import Link from "next/link";
import { ClipboardPlus } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { cn } from "@/lib/utils";

const DASHBOARD_EMPTY_STATE_TITLE_ID = "dashboard-empty-state-title";
const DASHBOARD_EMPTY_STATE_DESCRIPTION_ID = "dashboard-empty-state-description";

const primaryActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "bg-[var(--at-blue)] text-white font-semibold",
  "hover:bg-[var(--at-blue-hover)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

export function DashboardEmptyState() {
  return (
    <section aria-labelledby={DASHBOARD_EMPTY_STATE_TITLE_ID}>
      <AppCard className="min-w-0">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex size-12 items-center justify-center rounded-full bg-[var(--at-surface-input)]"
            aria-hidden="true"
          >
            <ClipboardPlus
              className="size-6 text-[var(--at-text-secondary)]"
              strokeWidth={1.75}
            />
          </div>

          <h2
            id={DASHBOARD_EMPTY_STATE_TITLE_ID}
            className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]"
          >
            Você ainda não possui registros
          </h2>

          <p
            id={DASHBOARD_EMPTY_STATE_DESCRIPTION_ID}
            className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]"
          >
            Adicione seu primeiro registro para começar a acompanhar suas
            medições e sintomas.
          </p>

          <Link
            href="/paciente/novo-registro"
            className={cn("mt-4", primaryActionClasses)}
          >
            Fazer primeiro registro
          </Link>
        </div>
      </AppCard>
    </section>
  );
}
