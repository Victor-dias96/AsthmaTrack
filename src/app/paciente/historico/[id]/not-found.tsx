import Link from "next/link";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppCard } from "@/components/ui/app-card";
import { HISTORY_PATH } from "@/features/history/constants";

const backLinkClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

export default function DailyRecordDetailsNotFound() {
  return (
    <PatientShell>
      <div className="min-w-0 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Registro não encontrado
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Não foi possível encontrar este registro.
          </p>
        </div>

        <AppCard className="min-w-0">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
              Volte ao histórico para consultar seus registros.
            </p>
            <Link href={HISTORY_PATH} className={backLinkClasses}>
              Voltar ao histórico
            </Link>
          </div>
        </AppCard>
      </div>
    </PatientShell>
  );
}
