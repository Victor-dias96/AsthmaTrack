import type { PostgrestError } from "@supabase/supabase-js";

import { AUTHORIZATION_SESSION_EXPIRED_MESSAGE } from "./classify-authorization-verification";

export const AUTHORIZATION_REVOKE_CONNECTION_ERROR_MESSAGE =
  "Não foi possível revogar o acesso. Verifique sua conexão e tente novamente.";

export const AUTHORIZATION_REVOKE_UNEXPECTED_ERROR_MESSAGE =
  "Ocorreu um erro ao revogar o acesso. Tente novamente.";

/**
 * Safe, generic message for every "zero rows affected" outcome: the row
 * never existed, belongs to another patient, was already revoked, or lost
 * eligibility in a concurrent request. Never distinguishes between these
 * cases -- see the Issue 102 SELECT/UPDATE policies this deliberately does
 * not describe.
 */
export const AUTHORIZATION_REVOKE_NO_ROW_MESSAGE =
  "Não foi possível revogar este acesso. Atualize a página e tente novamente.";

export const AUTHORIZATION_REVOKE_SUCCESS_MESSAGE =
  "Acesso revogado com sucesso.";

const AUTH_ERROR_CODES = new Set(["PGRST301"]);

const CONNECTION_ERROR_CODES = new Set([
  "PGRST000",
  "PGRST002",
  "PGRST003",
  "08000",
  "08003",
  "08006",
  "57P01",
  "57P03",
]);

const RATE_LIMIT_HTTP_STATUSES = new Set([429]);

const CONNECTION_HTTP_STATUSES = new Set([0, 408, 502, 503, 504]);

export type AuthorizationRevokeErrorKind = "auth" | "connection" | "unexpected";

/**
 * Classifies a thrown error from the `patient_access_authorizations`
 * revocation update. Zero-row RLS/ownership outcomes never reach here --
 * they surface no PostgrestError at all and are handled by the caller via
 * AUTHORIZATION_REVOKE_NO_ROW_MESSAGE instead (mirrors the existing
 * `!deletedRow` handling in
 * src/features/history/components/daily-record-delete-action.tsx). This
 * never exposes a raw Supabase error, SQL, policy name, function name,
 * table name or constraint name.
 */
export function classifyAuthorizationRevokeError(
  error: PostgrestError,
  httpStatus?: number
): { kind: AuthorizationRevokeErrorKind; message: string } {
  const code = error.code ?? "";

  if (AUTH_ERROR_CODES.has(code)) {
    return { kind: "auth", message: AUTHORIZATION_SESSION_EXPIRED_MESSAGE };
  }

  const isRateLimit =
    httpStatus !== undefined && RATE_LIMIT_HTTP_STATUSES.has(httpStatus);
  const isConnectionStatus =
    httpStatus !== undefined && CONNECTION_HTTP_STATUSES.has(httpStatus);

  if (CONNECTION_ERROR_CODES.has(code) || isRateLimit || isConnectionStatus) {
    return {
      kind: "connection",
      message: AUTHORIZATION_REVOKE_CONNECTION_ERROR_MESSAGE,
    };
  }

  return {
    kind: "unexpected",
    message: AUTHORIZATION_REVOKE_UNEXPECTED_ERROR_MESSAGE,
  };
}

export function classifyAuthorizationRevokeNetworkError(): {
  kind: "connection";
  message: string;
} {
  return {
    kind: "connection",
    message: AUTHORIZATION_REVOKE_CONNECTION_ERROR_MESSAGE,
  };
}
