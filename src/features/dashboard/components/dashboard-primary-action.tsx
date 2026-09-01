import { AppCard } from "@/components/ui/app-card";

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
        <div
          aria-hidden="true"
          className="mt-4 h-12 rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-blue)]/40 bg-[var(--at-surface)]/60"
        />
      </AppCard>
    </section>
  );
}
