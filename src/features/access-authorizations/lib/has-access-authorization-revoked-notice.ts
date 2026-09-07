import {
  ACCESS_AUTHORIZATION_REVOKED_NOTICE_PARAM,
  ACCESS_AUTHORIZATION_REVOKED_NOTICE_VALUE,
} from "../constants";

/**
 * Accepts only the exact internal revocation-notice value (Issue 105).
 * Mirrors src/features/history/lib/has-history-deleted-notice.ts. Repeated
 * or unexpected values are ignored, and the flag never carries an
 * authorization id, patient id or professional name -- it is only used to
 * decide whether to render the fixed success message after
 * RevokeAccessAuthorizationAction navigates back to this same page.
 */
export function hasAccessAuthorizationRevokedNotice(
  params: Record<string, string | string[] | undefined>
): boolean {
  return (
    params[ACCESS_AUTHORIZATION_REVOKED_NOTICE_PARAM] ===
    ACCESS_AUTHORIZATION_REVOKED_NOTICE_VALUE
  );
}
