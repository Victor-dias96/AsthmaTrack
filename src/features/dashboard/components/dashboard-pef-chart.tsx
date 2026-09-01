import { AppCard, AppCardHeader } from "@/components/ui/app-card";

export function DashboardPefChart() {
  return (
    <section>
      <AppCard className="min-w-0">
        <AppCardHeader
          title="Evolução do PEF"
          description="O gráfico das suas medições será exibido aqui."
        />
        <div
          aria-hidden="true"
          className="min-h-48 rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-border)] bg-[var(--at-surface-input)]/50"
        />
      </AppCard>
    </section>
  );
}
