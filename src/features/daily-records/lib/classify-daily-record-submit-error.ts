import type { AuthError, PostgrestError, User } from "@supabase/supabase-js";

export const DAILY_RECORD_AUTH_ERROR_MESSAGE =
  "Sua sessão expirou. Entre novamente para continuar.";

export const DAILY_RECORD_CONNECTION_ERROR_MESSAGE =
  "Não foi possível salvar o registro. Seus dados foram mantidos. Verifique sua conexão e tente novamente.";

export const DAILY_RECORD_OFFLINE_INDICATOR_MESSAGE =
  "Você está sem conexão. Seus dados continuam preenchidos nesta página.";

export const DAILY_RECORD_UNCONFIRMED_SAVE_MESSAGE =
  "Não foi possível confirmar o salvamento. Verifique seu histórico antes de tentar novamente.";

export const DAILY_RECORD_PERMISSION_ERROR_MESSAGE =
  "Não foi possível salvar o registro. Atualize a página e tente novamente.";

export const DAILY_RECORD_UNEXPECTED_ERROR_MESSAGE =
  "Ocorreu um erro ao salvar o registro. Tente novamente.";

export const DAILY_RECORD_SUCCESS_MESSAGE = "Registro salvo com sucesso.";

const PERMISSION_ERROR_CODES = new Set(["42501"]);

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

const AUTH_ERROR_CODES = new Set(["PGRST301"]);

const RATE_LIMIT_CODES = new Set(["429"]);

const CONNECTION_HTTP_STATUSES = new Set([0, 408, 502, 503, 504]);

const RATE_LIMIT_HTTP_STATUSES = new Set([429]);

const DEFINITIVE_UNAUTHENTICATED_STATUSES = new Set([401, 403]);

const DEFINITIVE_UNAUTHENTICATED_ERROR_NAMES = new Set([
  "AuthSessionMissingError",
  "AuthInvalidJwtError",
]);

export type DailyRecordInsertErrorKind =
  | "auth"
  | "connection"
  | "permission"
  | "unexpected";

export type DailyRecordNetworkErrorKind = "connection" | "unconfirmed";

export type DailyRecordAuthVerificationResult =
  | { kind: "authenticated"; user: User }
  | { kind: "unauthenticated"; message: string }
  | { kind: "connection"; message: string };

/**
 * Distinguishes a completed "no session" result from an auth request that
 * never finished. Offline `getUser()` failures typically return
 * `AuthRetryableFetchError` with status `0` and `user: null`; that is not
 * proof the patient is unauthenticated.
 */
function isIncompleteAuthVerification(error: AuthError): boolean {
  if (error.name === "AuthRetryableFetchError") {
    return true;
  }

  const status = error.status;

  if (status === undefined || status === 0 || status === 408 || status === 429) {
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

export function classifyDailyRecordAuthVerification(
  user: User | null,
  error: AuthError | null
): DailyRecordAuthVerificationResult {
  if (user) {
    return { kind: "authenticated", user };
  }

  if (error) {
    if (isIncompleteAuthVerification(error)) {
      return {
        kind: "connection",
        message: DAILY_RECORD_CONNECTION_ERROR_MESSAGE,
      };
    }

    if (isDefinitiveUnauthenticatedError(error)) {
      return {
        kind: "unauthenticated",
        message: DAILY_RECORD_AUTH_ERROR_MESSAGE,
      };
    }

    return {
      kind: "connection",
      message: DAILY_RECORD_CONNECTION_ERROR_MESSAGE,
    };
  }

  return {
    kind: "unauthenticated",
    message: DAILY_RECORD_AUTH_ERROR_MESSAGE,
  };
}

export function classifyDailyRecordInsertError(
  error: PostgrestError,
  httpStatus?: number
): { kind: DailyRecordInsertErrorKind; message: string } {
  const code = error.code ?? "";

  if (AUTH_ERROR_CODES.has(code)) {
    return { kind: "auth", message: DAILY_RECORD_AUTH_ERROR_MESSAGE };
  }

  if (PERMISSION_ERROR_CODES.has(code)) {
    return { kind: "permission", message: DAILY_RECORD_PERMISSION_ERROR_MESSAGE };
  }

  const isRateLimit =
    RATE_LIMIT_CODES.has(code) ||
    (httpStatus !== undefined && RATE_LIMIT_HTTP_STATUSES.has(httpStatus));

  const isConnectionStatus =
    httpStatus !== undefined && CONNECTION_HTTP_STATUSES.has(httpStatus);

  if (CONNECTION_ERROR_CODES.has(code) || isRateLimit || isConnectionStatus) {
    return { kind: "connection", message: DAILY_RECORD_CONNECTION_ERROR_MESSAGE };
  }

  return {
    kind: "unexpected",
    message: DAILY_RECORD_UNEXPECTED_ERROR_MESSAGE,
  };
}

export function classifyDailyRecordUnexpectedResponse(): {
  kind: "unexpected";
  message: string;
} {
  return {
    kind: "unexpected",
    message: DAILY_RECORD_UNEXPECTED_ERROR_MESSAGE,
  };
}

/**
 * Thrown fetch failures before the insert is sent are connection errors.
 * After the insert call starts, a dropped connection cannot prove whether
 * the row was persisted, so the result is treated as unconfirmed.
 */
export function classifyDailyRecordNetworkError(insertAttempted: boolean): {
  kind: DailyRecordNetworkErrorKind;
  message: string;
} {
  if (insertAttempted) {
    return {
      kind: "unconfirmed",
      message: DAILY_RECORD_UNCONFIRMED_SAVE_MESSAGE,
    };
  }

  return {
    kind: "connection",
    message: DAILY_RECORD_CONNECTION_ERROR_MESSAGE,
  };
}
