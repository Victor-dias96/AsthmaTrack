import type { PostgrestError } from "@supabase/supabase-js";

import { AUTHORIZATION_SESSION_EXPIRED_MESSAGE } from "./classify-authorization-verification";

export const AUTHORIZATION_INSERT_CONNECTION_ERROR_MESSAGE =
  "Não foi possível autorizar o acesso. Verifique sua conexão e tente novamente.";

export const AUTHORIZATION_INSERT_UNEXPECTED_ERROR_MESSAGE =
  "Ocorreu um erro ao autorizar o acesso. Tente novamente.";

export const AUTHORIZATION_DUPLICATE_MESSAGE =
  "Este profissional já possui acesso ativo.";

const AUTH_ERROR_CODES = new Set(["PGRST301"]);

/** Postgres unique_violation -- the Issue 101 partial unique index is the
 * definitive duplicate-active-authorization guard; this is only mapped to a
 * friendly message, never relied on for correctness. */
const DUPLICATE_ACTIVE_AUTHORIZATION_CODE = "23505";

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

export type AuthorizationInsertErrorKind =
  "auth" | "connection" | "duplicate" | "unexpected";

/**
 * Classifies an error from the `patient_access_authorizations` insert.
 * Uses the structured Postgres error code for the one condition that needs
 * a distinct, friendly message (an existing active authorization); every
 * other database rejection -- self-authorization, non-medical target, a
 * caller who isn't a persisted patient -- is an RLS/CHECK failure that is
 * never expected to reach the UI (the form already prevents those cases)
 * and safely falls through to the generic "unexpected" message without
 * exposing policy or constraint names.
 */
export function classifyAuthorizationInsertError(
  error: PostgrestError,
  httpStatus?: number
): { kind: AuthorizationInsertErrorKind; message: string } {
  const code = error.code ?? "";

  if (code === DUPLICATE_ACTIVE_AUTHORIZATION_CODE) {
    return { kind: "duplicate", message: AUTHORIZATION_DUPLICATE_MESSAGE };
  }

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
      message: AUTHORIZATION_INSERT_CONNECTION_ERROR_MESSAGE,
    };
  }

  return {
    kind: "unexpected",
    message: AUTHORIZATION_INSERT_UNEXPECTED_ERROR_MESSAGE,
  };
}
