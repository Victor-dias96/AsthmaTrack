import type { PostgrestError } from "@supabase/supabase-js";

export const DAILY_RECORD_AUTH_ERROR_MESSAGE =
  "Sua sessão expirou. Entre novamente para continuar.";

export const DAILY_RECORD_CONNECTION_ERROR_MESSAGE =
  "Não foi possível salvar o registro. Verifique sua conexão e tente novamente.";

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

export type DailyRecordInsertErrorKind = "auth" | "connection" | "permission" | "unexpected";

export function classifyDailyRecordInsertError(
  error: PostgrestError
): { kind: DailyRecordInsertErrorKind; message: string } {
  const code = error.code ?? "";

  if (AUTH_ERROR_CODES.has(code)) {
    return { kind: "auth", message: DAILY_RECORD_AUTH_ERROR_MESSAGE };
  }

  if (PERMISSION_ERROR_CODES.has(code)) {
    return { kind: "permission", message: DAILY_RECORD_PERMISSION_ERROR_MESSAGE };
  }

  if (CONNECTION_ERROR_CODES.has(code)) {
    return { kind: "connection", message: DAILY_RECORD_CONNECTION_ERROR_MESSAGE };
  }

  return {
    kind: "unexpected",
    message: DAILY_RECORD_UNEXPECTED_ERROR_MESSAGE,
  };
}

export function classifyDailyRecordNetworkError(): {
  kind: "connection";
  message: string;
} {
  return {
    kind: "connection",
    message: DAILY_RECORD_CONNECTION_ERROR_MESSAGE,
  };
}
