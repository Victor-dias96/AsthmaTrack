/** Initial history page size. Pagination is deferred to a later issue. */
export const HISTORY_INITIAL_LIMIT = 20;

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
