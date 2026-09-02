/**
 * Dashboard content presentation states.
 *
 * Issue 88 selects one mutually exclusive state after the dashboard query:
 * - `ready`: at least one daily record exists; show metrics, chart and recent records.
 * - `empty`: query succeeded and total record count is exactly zero.
 * - `unavailable`: the dashboard query failed; do not show the general empty state.
 *
 * `pending-integration` is the pre-integration default until Issue 88 supplies data.
 * `loading` is reserved for an in-progress dashboard query (Issue 88).
 */
export type DashboardContentState =
  | "pending-integration"
  | "loading"
  | "ready"
  | "empty"
  | "unavailable";

export const DASHBOARD_DEFAULT_CONTENT_STATE: DashboardContentState =
  "pending-integration";
