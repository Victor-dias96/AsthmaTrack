export const DASHBOARD_SUMMARY_PLACEHOLDER_LABELS = [] as const;

export type DashboardSummaryPlaceholderLabel =
  (typeof DASHBOARD_SUMMARY_PLACEHOLDER_LABELS)[number];

export const DASHBOARD_SUMMARY_METRIC_LABELS =
  DASHBOARD_SUMMARY_PLACEHOLDER_LABELS;

export type DashboardSummaryMetricLabel = DashboardSummaryPlaceholderLabel;
