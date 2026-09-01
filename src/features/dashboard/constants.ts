export const DASHBOARD_SUMMARY_METRIC_LABELS = [
  "Último PEF",
  "Data do último registro",
  "Total de registros",
  "Dias com sintomas",
  "Crises registradas",
  "Uso de medicação de alívio",
] as const;

export type DashboardSummaryMetricLabel =
  (typeof DASHBOARD_SUMMARY_METRIC_LABELS)[number];
