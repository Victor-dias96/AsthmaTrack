"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppCheckbox } from "@/components/ui/app-checkbox";
import { FormField } from "@/components/ui/form-field";
import { AppAlert } from "@/components/ui/app-alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/client";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  terms?: string;
};

export function RegisterForm() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [requireEmailConfirmation, setRequireEmailConfirmation] = useState(false);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setAuthError(null);
    setRequireEmailConfirmation(false);

    const isValid = validate();
    if (!isValid) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        // Map Supabase errors to concise PT-BR messages
        let message = "Ocorreu um erro ao criar sua conta. Tente novamente.";
        
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          message = "Este e-mail já está cadastrado.";
        } else if (error.message.includes("valid email") || error.status === 422) {
          message = "O e-mail informado é inválido.";
        } else if (error.message.includes("weak_password") || error.message.includes("Password should be")) {
          message = "A senha é muito fraca. Tente uma senha mais segura.";
        } else if (error.message.includes("Failed to fetch") || error.message.includes("Network")) {
          message = "Falha na conexão. Verifique sua internet.";
        } else if (error.message.includes("not configured") || error.message.includes("missing")) {
          message = "Erro de configuração do servidor.";
        }

        setAuthError(message);
        setLoading(false);
        return;
      }

      // Check if signup succeeded but requires email confirmation
      if (data.session === null && data.user) {
        setRequireEmailConfirmation(true);
        setLoading(false);
        return;
      }

      // Success with active session -> redirect to onboarding
      router.push("/onboarding");
    } catch {
      setAuthError("Erro inesperado. Tente novamente mais tarde.");
      setLoading(false);
    }
  }

  if (requireEmailConfirmation) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--at-text-primary)]">
            Verifique seu e-mail
          </h1>
          <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
            Quase lá!
          </p>
        </div>
        <AppAlert variant="success">
          Enviamos um link de confirmação para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada para ativar sua conta.
        </AppAlert>
        <AppButton variant="outline" fullWidth onClick={() => router.push("/login")}>
          Voltar para o login
        </AppButton>
      </div>
    );
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

      {authError && <AppAlert variant="warning">{authError}</AppAlert>}

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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </FormField>

        <AppCheckbox
          id="register-terms"
          name="terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          error={errors.terms}
          disabled={loading}
          label={
            <span>
              Li e aceito os Termos de Uso e a Política de Privacidade
            </span>
          }
        />

        <AppButton type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="sm" label="Criando conta" />
              <span className="ml-2">Criando conta...</span>
            </>
          ) : (
            "Criar conta"
          )}
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
