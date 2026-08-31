import {
  HISTORY_DELETED_NOTICE_PARAM,
  HISTORY_DELETED_NOTICE_VALUE,
} from "../constants";

/**
 * Accepts only the exact internal deletion notice value.
 * Repeated or unexpected values are ignored.
 */
export function hasHistoryDeletedNotice(
  params: Record<string, string | string[] | undefined>
): boolean {
  return params[HISTORY_DELETED_NOTICE_PARAM] === HISTORY_DELETED_NOTICE_VALUE;
}
