"use client";

import { useState } from "react";
import Link from "next/link";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";

type FormErrors = {
  password?: string;
  passwordConfirm?: string;
};

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!password) {
      newErrors.password = "Informe a nova senha";
    } else if (password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = "Confirme a nova senha";
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "As senhas não coincidem";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Backend password update integration pending (Supabase in future task).
      // Do not show fake success state or fake redirect.
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--at-text-primary)]">
          Redefinir senha
        </h1>
        <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
          Crie uma nova senha para acessar sua conta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="Nova senha"
          htmlFor="reset-password"
          required
          error={errors.password}
        >
          <AppInput
            id="reset-password"
            name="password"
            type="password"
            placeholder="Digite a nova senha"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hasError={!!errors.password}
            required
          />
        </FormField>

        <FormField
          label="Confirmar nova senha"
          htmlFor="reset-password-confirm"
          required
          error={errors.passwordConfirm}
        >
          <AppInput
            id="reset-password-confirm"
            name="passwordConfirm"
            type="password"
            placeholder="Repita a nova senha"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            hasError={!!errors.passwordConfirm}
            required
          />
        </FormField>

        <AppButton type="submit" fullWidth size="lg">
          Atualizar senha
        </AppButton>
      </form>

      <p className="text-center text-sm text-[var(--at-text-secondary)]">
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
