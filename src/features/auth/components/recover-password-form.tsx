"use client";

import { useState } from "react";
import Link from "next/link";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/client";

const GENERIC_SUCCESS_MESSAGE =
  "Se existir uma conta com este e-mail, enviaremos as instruções de recuperação.";

export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Informe seu e-mail");
      return null;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Informe um e-mail válido");
      return null;
    }

    setError("");
    return normalizedEmail;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setAuthError(null);
    setSuccessMessage(null);

    const normalizedEmail = validate();
    if (!normalizedEmail) return;

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }
      );

      if (resetError) {
        let message = "Ocorreu um erro ao enviar o e-mail. Tente novamente.";

        if (
          resetError.message.includes("Failed to fetch") ||
          resetError.message.includes("Network")
        ) {
          message = "Falha na conexão. Verifique sua internet.";
        } else if (
          resetError.status === 429 ||
          resetError.message.toLowerCase().includes("rate limit") ||
          resetError.message.toLowerCase().includes("too many")
        ) {
          message =
            "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        } else if (
          resetError.message.includes("not configured") ||
          resetError.message.includes("missing")
        ) {
          message = "Erro de configuração do servidor.";
        } else if (
          resetError.message.includes("valid email") ||
          resetError.status === 422
        ) {
          setError("Informe um e-mail válido");
          setLoading(false);
          return;
        }

        setAuthError(message);
        setLoading(false);
        return;
      }

      setSuccessMessage(GENERIC_SUCCESS_MESSAGE);
      setLoading(false);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("Missing Supabase") ||
          err.message.includes("not configured") ||
          err.message.includes("missing"))
      ) {
        setAuthError("Erro de configuração do servidor.");
      } else {
        setAuthError("Erro inesperado. Tente novamente mais tarde.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--at-text-primary)]">
          Recuperar senha
        </h1>
        <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
          Informe seu e-mail cadastrado para receber as instruções de recuperação.
        </p>
      </div>

      {successMessage && (
        <AppAlert variant="success">{successMessage}</AppAlert>
      )}

      {authError && <AppAlert variant="warning">{authError}</AppAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="E-mail"
          htmlFor="recover-email"
          required
          error={error}
        >
          <AppInput
            id="recover-email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
              if (authError) setAuthError(null);
              if (successMessage) setSuccessMessage(null);
            }}
            hasError={!!error}
            required
            disabled={loading}
          />
        </FormField>

        <AppButton type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="sm" label="Enviando" />
              <span className="ml-2">Enviando...</span>
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </AppButton>
      </form>

      <p className="text-center text-sm text-[var(--at-text-secondary)]">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="text-[var(--at-blue)] font-medium hover:underline"
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
