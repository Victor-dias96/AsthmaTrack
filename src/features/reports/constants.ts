export const REPORT_PATH = "/paciente/relatorio";

export const REPORT_PERIOD_PARAM = "periodo";

/**
 * Reports default to 30 days: a useful bounded summary, distinct from the
 * dashboard/history default of 7. No repository issue definition overrides
 * this to 7 for the report route.
 */
export const REPORT_DEFAULT_PERIOD = 30;

export const REPORT_PERIODS = [7, REPORT_DEFAULT_PERIOD, 90] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS = {
  7: "Últimos 7 dias",
  30: "Últimos 30 dias",
  90: "Últimos 90 dias",
} as const satisfies Record<ReportPeriod, string>;

/**
 * Minimum `daily_records` projection for the current summary and later
 * report sections. `id` is selected only as a deterministic secondary sort
 * key and is never mapped into presentational data.
 */
export const REPORT_PERIOD_RECORD_COLUMNS = [
  "id",
  "recorded_at",
  "pef_value",
  "cough_severity",
  "wheezing_severity",
  "shortness_of_breath_severity",
  "chest_tightness_severity",
  "had_attack",
  "used_rescue_medication",
].join(", ");
