import {
  DASHBOARD_PATH,
  DASHBOARD_PERIOD_PARAM,
  type DashboardPeriod,
} from "../constants";

/**
 * Builds the dashboard period URL from an already validated period.
 * Never accepts user-provided query strings or extra parameters.
 */
export function getDashboardPeriodHref(period: DashboardPeriod): string {
  const params = new URLSearchParams();
  params.set(DASHBOARD_PERIOD_PARAM, String(period));
  return `${DASHBOARD_PATH}?${params.toString()}`;
}
