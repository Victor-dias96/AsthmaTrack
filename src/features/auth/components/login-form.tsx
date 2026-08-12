"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppAlert } from "@/components/ui/app-alert";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/client";

type FormErrors = {
  email?: string;
  password?: string;
};

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  function validate() {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "Informe seu e-mail";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Informe um e-mail válido";
    }

    if (!password) {
      newErrors.password = "Informe sua senha";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setAuthError(null);

    const isValid = validate();
    if (!isValid) return;

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        let message = "Ocorreu um erro ao entrar. Tente novamente.";

        if (
          signInError.message.includes("Invalid login credentials") ||
          signInError.message.includes("invalid_credentials")
        ) {
          message = "E-mail ou senha incorretos.";
        } else if (signInError.message.includes("Email not confirmed")) {
          message =
            "E-mail não confirmado. Verifique sua caixa de entrada.";
        } else if (
          signInError.message.includes("Failed to fetch") ||
          signInError.message.includes("Network")
        ) {
          message = "Falha na conexão. Verifique sua internet.";
        } else if (
          signInError.message.includes("not configured") ||
          signInError.message.includes("missing")
        ) {
          message = "Erro de configuração do servidor.";
        }

        setAuthError(message);
        setLoading(false);
        return;
      }

      // Query the authenticated user's own profile — never trust client input
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .single();

      if (profileError || !profile) {
        setAuthError(
          "Não foi possível carregar seu perfil. Tente novamente."
        );
        setLoading(false);
        return;
      }

      // Determine destination based on profile data
      if (!profile.onboarding_completed) {
        router.replace("/onboarding");
        return;
      }

      if (profile.role === "patient") {
        router.replace("/paciente/dashboard");
        return;
      }

      // Medical role: no dedicated route yet — task remaining
      // Redirect to onboarding as safe fallback until medical dashboard exists
      router.replace("/onboarding");
    } catch {
      setAuthError("Erro inesperado. Tente novamente mais tarde.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--at-text-primary)]">
          Entrar
        </h1>
        <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
          Acesse sua conta para continuar
        </p>
      </div>

      {authError && <AppAlert variant="warning">{authError}</AppAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="E-mail" htmlFor="login-email" required error={errors.email}>
          <AppInput
            id="login-email"
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

        <FormField label="Senha" htmlFor="login-password" required error={errors.password}>
          <AppInput
            id="login-password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hasError={!!errors.password}
            required
            disabled={loading}
          />
        </FormField>

        <div className="text-right">
          <Link
            href="/recuperar-senha"
            className="text-sm text-[var(--at-blue)] hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        <AppButton type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="sm" label="Entrando" />
              <span className="ml-2">Entrando...</span>
            </>
          ) : (
            "Entrar"
          )}
        </AppButton>
      </form>

      <p className="text-center text-sm text-[var(--at-text-secondary)]">
        Não tem conta?{" "}
        <Link
          href="/cadastro"
          className="text-[var(--at-blue)] font-medium hover:underline"
        >
          Criar conta
        </Link>
      </p>

      <AppAlert variant="warning">
        Seus dados são armazenados com segurança e nunca são compartilhados
        sem sua autorização.
      </AppAlert>
    </div>
  );
}
