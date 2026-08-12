"use client";

import { useState } from "react";
import Link from "next/link";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";

export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      setError("Informe seu e-mail");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Informe um e-mail válido");
      return;
    }

    setError("");
    // Email sending integration pending (Supabase in future task).
    // Do not show fake email sent success banner to production users.
  }

  const isDev = process.env.NODE_ENV === "development";

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
            }}
            hasError={!!error}
            required
          />
        </FormField>

        <AppButton type="submit" fullWidth size="lg">
          Enviar link de recuperação
        </AppButton>
      </form>

      {isDev && (
        <AppAlert variant="info">
          Modo de desenvolvimento: o envio de e-mails será integrado com Supabase em uma etapa posterior.
        </AppAlert>
      )}

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
