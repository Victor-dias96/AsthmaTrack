export function DashboardPeriodFilter() {
  return (
    <section
      aria-labelledby="dashboard-period-label"
      aria-describedby="dashboard-period-description"
      className="min-w-0"
    >
      <p
        id="dashboard-period-label"
        className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]"
      >
        Período
      </p>
      <p
        id="dashboard-period-description"
        className="mt-2 text-sm text-[var(--at-text-secondary)]"
      >
        Opções de 7, 30 e 90 dias estarão disponíveis em breve.
      </p>
    </section>
  );
}
