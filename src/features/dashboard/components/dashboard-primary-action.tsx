import Link from "next/link";
import { Plus } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { cn } from "@/lib/utils";

const primaryActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-12 px-5 text-base rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "bg-[var(--at-blue)] text-white font-semibold",
  "hover:bg-[var(--at-blue-hover)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

export function DashboardPrimaryAction() {
  return (
    <section aria-labelledby="dashboard-primary-action-heading">
      <AppCard className="border-2 border-[var(--at-blue)] bg-[var(--at-blue-light)]">
        <h2
          id="dashboard-primary-action-heading"
          className="text-lg font-semibold text-[var(--at-text-primary)]"
        >
          Registro diário
        </h2>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Registre suas medições e sintomas do dia.
        </p>
        <Link
          href="/paciente/novo-registro"
          className={cn("mt-4", primaryActionClasses)}
        >
          <Plus className="size-5 shrink-0" aria-hidden="true" />
          Registrar dados de hoje
        </Link>
      </AppCard>
    </section>
  );
}
