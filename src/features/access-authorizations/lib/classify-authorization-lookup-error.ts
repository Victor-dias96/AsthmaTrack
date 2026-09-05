import type { PostgrestError } from "@supabase/supabase-js";

import { AUTHORIZATION_SESSION_EXPIRED_MESSAGE } from "./classify-authorization-verification";

export const AUTHORIZATION_LOOKUP_CONNECTION_ERROR_MESSAGE =
  "Não foi possível localizar o profissional. Verifique sua conexão e tente novamente.";

export const AUTHORIZATION_LOOKUP_NOT_FOUND_MESSAGE =
  "Não foi possível localizar um profissional válido com os dados informados.";

export const AUTHORIZATION_LOOKUP_UNEXPECTED_ERROR_MESSAGE =
  "Ocorreu um erro ao localizar o profissional. Tente novamente.";

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

export type AuthorizationLookupErrorKind = "auth" | "connection" | "unexpected";

/**
 * Classifies an error from `find_medical_professional_by_code`. This
 * function never distinguishes "no rows" from any other reason inside the
 * database (that distinction does not exist -- see the RPC's comment):
 * `error` here is only ever a genuine request failure (auth/connection/
 * unexpected), never "professional not found".
 */
export function classifyAuthorizationLookupError(
  error: PostgrestError,
  httpStatus?: number
): { kind: AuthorizationLookupErrorKind; message: string } {
  const code = error.code ?? "";

  if (AUTH_ERROR_CODES.has(code)) {
    return {
      kind: "auth",
      message: AUTHORIZATION_SESSION_EXPIRED_MESSAGE,
    };
  }

  const isRateLimit =
    httpStatus !== undefined && RATE_LIMIT_HTTP_STATUSES.has(httpStatus);
  const isConnectionStatus =
    httpStatus !== undefined && CONNECTION_HTTP_STATUSES.has(httpStatus);

  if (CONNECTION_ERROR_CODES.has(code) || isRateLimit || isConnectionStatus) {
    return {
      kind: "connection",
      message: AUTHORIZATION_LOOKUP_CONNECTION_ERROR_MESSAGE,
    };
  }

  return {
    kind: "unexpected",
    message: AUTHORIZATION_LOOKUP_UNEXPECTED_ERROR_MESSAGE,
  };
}
