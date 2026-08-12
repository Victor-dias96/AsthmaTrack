"use client";

import { useState } from "react";
import Link from "next/link";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppCheckbox } from "@/components/ui/app-checkbox";
import { FormField } from "@/components/ui/form-field";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  terms?: string;
};

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate() {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Informe seu nome completo";
    }

    if (!email.trim()) {
      newErrors.email = "Informe seu e-mail";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Informe um e-mail válido";
    }

    if (!password) {
      newErrors.password = "Crie uma senha";
    } else if (password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = "Confirme sua senha";
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "As senhas não coincidem";
    }

    if (!acceptedTerms) {
      newErrors.terms = "Você precisa aceitar os termos de uso para continuar";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const isValid = validate();

    if (isValid) {
      // Backend registration integration pending (Supabase in future task).
      // Do not show fake success message or simulate account creation.
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--at-text-primary)]">
          Criar conta
        </h1>
        <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
          Preencha os dados abaixo para começar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="Nome completo"
          htmlFor="register-name"
          required
          error={errors.name}
        >
          <AppInput
            id="register-name"
            name="name"
            type="text"
            placeholder="Seu nome completo"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            hasError={!!errors.name}
            required
          />
        </FormField>

        <FormField
          label="E-mail"
          htmlFor="register-email"
          required
          error={errors.email}
        >
          <AppInput
            id="register-email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hasError={!!errors.email}
            required
          />
        </FormField>

        <FormField
          label="Senha"
          htmlFor="register-password"
          required
          error={errors.password}
        >
          <AppInput
            id="register-password"
            name="password"
            type="password"
            placeholder="Crie uma senha (mínimo 6 caracteres)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hasError={!!errors.password}
            required
          />
        </FormField>

        <FormField
          label="Confirmar senha"
          htmlFor="register-password-confirm"
          required
          error={errors.passwordConfirm}
        >
          <AppInput
            id="register-password-confirm"
            name="passwordConfirm"
            type="password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            hasError={!!errors.passwordConfirm}
            required
          />
        </FormField>

        <AppCheckbox
          id="register-terms"
          name="terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          error={errors.terms}
          label={
            <span>
              Li e aceito os Termos de Uso e a Política de Privacidade
            </span>
          }
        />

        <AppButton type="submit" fullWidth size="lg">
          Criar conta
        </AppButton>
      </form>

      <p className="text-center text-sm text-[var(--at-text-secondary)]">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="text-[var(--at-blue)] font-medium hover:underline"
        >
          Entrar
        </Link>
      </p>

      <p className="text-center text-xs text-[var(--at-text-secondary)]">
        Gratuito para pacientes
      </p>
    </div>
  );
}
