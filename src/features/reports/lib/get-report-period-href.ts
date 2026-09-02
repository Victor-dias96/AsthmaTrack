import {
  REPORT_PATH,
  REPORT_PERIOD_PARAM,
  type ReportPeriod,
} from "../constants";

/**
 * Builds the report period URL from an already validated period.
 * Never accepts user-provided query strings or extra parameters.
 */
export function getReportPeriodHref(period: ReportPeriod): string {
  const params = new URLSearchParams();
  params.set(REPORT_PERIOD_PARAM, String(period));
  return `${REPORT_PATH}?${params.toString()}`;
}
