import { AppCard } from "@/components/ui/app-card";

import { DASHBOARD_SUMMARY_METRIC_LABELS } from "../constants";

export function DashboardSummaryMetrics() {
  return (
    <section
      aria-labelledby="dashboard-summary-heading"
      aria-describedby="dashboard-summary-description"
      className="min-w-0"
    >
      <h2
        id="dashboard-summary-heading"
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Resumo
      </h2>
      <p
        id="dashboard-summary-description"
        className="mt-0.5 text-sm text-[var(--at-text-secondary)]"
      >
        Dados serão exibidos após a integração.
      </p>

      <ul className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_SUMMARY_METRIC_LABELS.map((label) => (
          <li key={label} className="min-w-0">
            <AppCard padding="sm" className="min-w-0">
              <h3 className="text-sm font-medium text-[var(--at-text-secondary)]">
                {label}
              </h3>
              <div
                aria-hidden="true"
                className="mt-2 h-8 rounded-[var(--at-radius-sm)] bg-[var(--at-surface-input)]"
              />
            </AppCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
