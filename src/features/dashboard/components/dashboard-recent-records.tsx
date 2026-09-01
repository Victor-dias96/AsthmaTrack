import { AppCard, AppCardHeader } from "@/components/ui/app-card";

export function DashboardRecentRecords() {
  return (
    <section>
      <AppCard className="min-w-0">
        <AppCardHeader
          title="Registros recentes"
          description="Seus registros mais recentes serão exibidos aqui."
        />
        <div
          aria-hidden="true"
          className="min-h-32 rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-border)] bg-[var(--at-surface-input)]/30"
        />
      </AppCard>
    </section>
  );
}
