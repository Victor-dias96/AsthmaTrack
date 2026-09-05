import type { AuthError, User } from "@supabase/supabase-js";

export const AUTHORIZATION_SESSION_EXPIRED_MESSAGE =
  "Sua sessão expirou. Entre novamente para continuar.";

export const AUTHORIZATION_VERIFY_CONNECTION_MESSAGE =
  "Não foi possível confirmar sua sessão. Verifique sua conexão e tente novamente.";

const DEFINITIVE_UNAUTHENTICATED_STATUSES = new Set([401, 403]);

const DEFINITIVE_UNAUTHENTICATED_ERROR_NAMES = new Set([
  "AuthSessionMissingError",
  "AuthInvalidJwtError",
]);

export type AuthorizationAuthVerificationResult =
  | { kind: "authenticated"; user: User }
  | { kind: "unauthenticated"; message: string }
  | { kind: "connection"; message: string };

/**
 * Distinguishes a completed "no session" result from an auth request that
 * never finished. Offline `getUser()` failures typically return a retryable
 * fetch error with status `0`/`undefined` and `user: null`; that is not
 * proof the patient is unauthenticated, so it must not be treated as a
 * definitive logout (see AUTHENTICATION BEFORE INSERT requirements).
 */
function isIncompleteAuthVerification(error: AuthError): boolean {
  if (error.name === "AuthRetryableFetchError") {
    return true;
  }

  const status = error.status;

  if (
    status === undefined ||
    status === 0 ||
    status === 408 ||
    status === 429
  ) {
    return true;
  }

  return status >= 500;
}

function isDefinitiveUnauthenticatedError(error: AuthError): boolean {
  if (DEFINITIVE_UNAUTHENTICATED_ERROR_NAMES.has(error.name)) {
    return true;
  }

  return (
    error.status !== undefined &&
    DEFINITIVE_UNAUTHENTICATED_STATUSES.has(error.status)
  );
}

/**
 * Re-verifies the authenticated patient with `auth.getUser()`. Used both
 * before showing a lookup result (to detect self-authorization) and again,
 * independently, immediately before the authorization insert -- a prior
 * client-held identity is never trusted indefinitely.
 */
export function classifyAuthorizationAuthVerification(
  user: User | null,
  error: AuthError | null
): AuthorizationAuthVerificationResult {
  if (user) {
    return { kind: "authenticated", user };
  }

  if (error) {
    if (isIncompleteAuthVerification(error)) {
      return {
        kind: "connection",
        message: AUTHORIZATION_VERIFY_CONNECTION_MESSAGE,
      };
    }

    if (isDefinitiveUnauthenticatedError(error)) {
      return {
        kind: "unauthenticated",
        message: AUTHORIZATION_SESSION_EXPIRED_MESSAGE,
      };
    }

    return {
      kind: "connection",
      message: AUTHORIZATION_VERIFY_CONNECTION_MESSAGE,
    };
  }

  return {
    kind: "unauthenticated",
    message: AUTHORIZATION_SESSION_EXPIRED_MESSAGE,
  };
}
