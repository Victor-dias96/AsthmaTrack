export const DASHBOARD_SUMMARY_PLACEHOLDER_LABELS = [] as const;

export type DashboardSummaryPlaceholderLabel =
  (typeof DASHBOARD_SUMMARY_PLACEHOLDER_LABELS)[number];

export const DASHBOARD_SUMMARY_METRIC_LABELS =
  DASHBOARD_SUMMARY_PLACEHOLDER_LABELS;

export type DashboardSummaryMetricLabel = DashboardSummaryPlaceholderLabel;

export const DASHBOARD_PATH = "/paciente/dashboard";

export const DASHBOARD_PERIOD_PARAM = "periodo";

export const DASHBOARD_DEFAULT_PERIOD = 7;

export const DASHBOARD_PERIODS = [DASHBOARD_DEFAULT_PERIOD, 30, 90] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

/** Fixed dashboard recent-records display limit. Not accepted from URL parameters. */
export const RECENT_RECORDS_DISPLAY_LIMIT = 3;
