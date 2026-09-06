export const PROFESSIONAL_CODE_FIELD_ID = "authorize-professional-code";

/** Delay before redirecting to /login after a definitive session-expiry. */
export const AUTHORIZATION_AUTH_REDIRECT_DELAY_MS = 2500;

/**
 * Product timezone for access-authorization display (Issue 104). No
 * product-wide timezone policy exists yet; America/Maceio matches the same
 * convention already used by src/features/history/constants.ts.
 */
export const ACCESS_AUTHORIZATION_TIME_ZONE = "America/Maceio";
