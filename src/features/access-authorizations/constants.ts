export const PROFESSIONAL_CODE_FIELD_ID = "authorize-professional-code";

/** Delay before redirecting to /login after a definitive session-expiry. */
export const AUTHORIZATION_AUTH_REDIRECT_DELAY_MS = 2500;

/**
 * Product timezone for access-authorization display (Issue 104). No
 * product-wide timezone policy exists yet; America/Maceio matches the same
 * convention already used by src/features/history/constants.ts.
 */
export const ACCESS_AUTHORIZATION_TIME_ZONE = "America/Maceio";

/** Canonical access-management page path (Issue 103/104/105). */
export const ACCESS_MANAGEMENT_PATH = "/paciente/configuracoes/acessos";

/**
 * Fixed, non-sensitive notice appended to the access-management URL after a
 * confirmed revocation (Issue 105). Mirrors the existing
 * HISTORY_DELETED_NOTICE_PARAM / HISTORY_DELETED_NOTICE_VALUE convention in
 * src/features/history/constants.ts: never an authorization id, patient id
 * or professional name, only a fixed flag the server page can check to show
 * a safe success message after the mutating Client Component navigates back
 * to this same page.
 */
export const ACCESS_AUTHORIZATION_REVOKED_NOTICE_PARAM = "revogado";
export const ACCESS_AUTHORIZATION_REVOKED_NOTICE_VALUE = "1";
