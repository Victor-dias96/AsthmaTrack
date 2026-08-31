/** Fixed history page size. Not accepted from URL parameters. */
export const HISTORY_PAGE_SIZE = 10;

export const HISTORY_DEFAULT_PAGE = 1;

export const HISTORY_PAGE_PARAM = "pagina";

/**
 * Product timezone for history display and period boundaries.
 * No product-wide timezone policy exists yet; America/Maceio matches the
 * current Brazilian application context.
 */
export const HISTORY_TIME_ZONE = "America/Maceio";

export const HISTORY_PATH = "/paciente/historico";

/** Fixed, non-sensitive history notice after a confirmed deletion. */
export const HISTORY_DELETED_NOTICE_PARAM = "excluido";

export const HISTORY_DELETED_NOTICE_VALUE = "1";

export const HISTORY_DEFAULT_PERIOD = 7;

export const HISTORY_FIXED_PERIODS = [HISTORY_DEFAULT_PERIOD, 30, 90] as const;

export type HistoryFixedPeriod = (typeof HISTORY_FIXED_PERIODS)[number];

export const HISTORY_CUSTOM_PERIOD = "custom" as const;

export const HISTORY_CUSTOM_PERIOD_PARAM = "personalizado" as const;

export const HISTORY_CUSTOM_RANGE_MAX_DAYS = 366;

export const HISTORY_PERIODS = [
  ...HISTORY_FIXED_PERIODS,
  HISTORY_CUSTOM_PERIOD,
] as const;

export type HistoryPeriod = (typeof HISTORY_PERIODS)[number];

export const DAILY_RECORD_HISTORY_COLUMNS = [
  "id",
  "patient_id",
  "recorded_at",
  "pef_value",
  "cough_severity",
  "wheezing_severity",
  "shortness_of_breath_severity",
  "chest_tightness_severity",
  "had_attack",
  "used_rescue_medication",
  "notes",
  "created_at",
  "updated_at",
].join(", ");
