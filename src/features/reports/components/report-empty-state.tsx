import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { cn } from "@/lib/utils";

const REPORT_EMPTY_STATE_TITLE_ID = "report-empty-state-title";
const REPORT_EMPTY_STATE_DESCRIPTION_ID = "report-empty-state-description";

const primaryActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "bg-[var(--at-blue)] text-white font-semibold",
  "hover:bg-[var(--at-blue-hover)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

const secondaryActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

export function ReportEmptyState() {
  return (
    <section
      aria-labelledby={REPORT_EMPTY_STATE_TITLE_ID}
      className="report-print-section"
    >
      <AppCard className="min-w-0">
        <div className="flex flex-col items-center text-center">
          <div
            className="report-print-hidden flex size-12 items-center justify-center rounded-full bg-[var(--at-surface-input)]"
            aria-hidden="true"
          >
            <ClipboardList
              className="size-6 text-[var(--at-text-secondary)]"
              strokeWidth={1.75}
            />
          </div>

          <h2
            id={REPORT_EMPTY_STATE_TITLE_ID}
            className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]"
          >
            Nenhum registro no período selecionado
          </h2>

          <p
            id={REPORT_EMPTY_STATE_DESCRIPTION_ID}
            className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]"
          >
            Não encontramos registros para gerar o resumo deste período.
          </p>

          <div className="report-print-hidden mt-4 flex w-full flex-col items-stretch justify-center gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/paciente/novo-registro"
              className={cn(primaryActionClasses)}
            >
              Fazer novo registro
            </Link>
            <Link href="/paciente/historico" className={secondaryActionClasses}>
              Ver histórico
            </Link>
          </div>
        </div>
      </AppCard>
    </section>
  );
}
