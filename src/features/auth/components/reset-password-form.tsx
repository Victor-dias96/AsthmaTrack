"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { hasRecoveryAmr } from "@/lib/auth/is-recovery-session";
import { createClient } from "@/lib/supabase/client";

type FormErrors = {
  password?: string;
  passwordConfirm?: string;
};

type RecoveryStatus = "checking" | "ready" | "invalid" | "success";

function hasHashRecoveryCredential(): boolean {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (
    hashParams.get("type") === "recovery" &&
    Boolean(hashParams.get("access_token"))
  );
}

export function ResetPasswordForm({
  recoveryVerified,
}: {
  recoveryVerified: boolean;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<RecoveryStatus>(
    recoveryVerified ? "ready" : "checking"
  );
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signOutFailed, setSignOutFailed] = useState(false);

  useEffect(() => {
    if (recoveryVerified) {
      return;
    }

    let cancelled = false;

    async function detectClientRecovery() {
      if (!hasHashRecoveryCredential()) {
        if (!cancelled) {
          setStatus("invalid");
        }
        return;
      }

      try {
        const supabase = createClient();
        await supabase.auth.initialize();
        const { data, error } = await supabase.auth.getClaims();

        if (cancelled) {
          return;
        }

        if (!error && hasRecoveryAmr(data?.claims)) {
          setStatus("ready");
          return;
        }
      } catch {
        // Missing configuration is reported only when the user submits.
      }

      if (!cancelled) {
        setStatus("invalid");
      }
    }

    void detectClientRecovery();

    return () => {
      cancelled = true;
    };
  }, [recoveryVerified]);

  function validate() {
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
    return Object.keys(newErrors).length === 0;
  }

  function clearSensitiveFields() {
    setPassword("");
    setPasswordConfirm("");
  }

  async function goToLoginAfterSignOut() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSignOutFailed(true);
        setAuthError(
          "Sua senha foi atualizada, mas não foi possível encerrar a sessão. Tente ir ao login novamente."
        );
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setSignOutFailed(true);
      setAuthError(
        "Sua senha foi atualizada, mas não foi possível encerrar a sessão. Tente ir ao login novamente."
      );
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setAuthError(null);
    setSignOutFailed(false);

    if (!validate()) return;

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        clearSensitiveFields();
        setStatus("invalid");
        setLoading(false);
        return;
      }

      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();

      if (claimsError || !hasRecoveryAmr(claimsData?.claims)) {
        clearSensitiveFields();
        setStatus("invalid");
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        let message = "Não foi possível atualizar a senha. Tente novamente.";

        if (
          updateError.message.includes("Failed to fetch") ||
          updateError.message.includes("Network")
        ) {
          message = "Falha na conexão. Verifique sua internet.";
        } else if (
          updateError.status === 429 ||
          updateError.message.toLowerCase().includes("rate limit") ||
          updateError.message.toLowerCase().includes("too many")
        ) {
          message =
            "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        } else if (
          updateError.message.includes("weak_password") ||
          updateError.message.includes("Password should be")
        ) {
          message = "A senha é muito fraca. Tente uma senha mais segura.";
        } else if (
          updateError.message.includes("not configured") ||
          updateError.message.includes("missing")
        ) {
          message = "Erro de configuração do servidor.";
        } else if (
          updateError.message.toLowerCase().includes("session") ||
          updateError.message.toLowerCase().includes("expired") ||
          updateError.message.toLowerCase().includes("invalid")
        ) {
          clearSensitiveFields();
          setStatus("invalid");
          setLoading(false);
          return;
        }

        clearSensitiveFields();
        setAuthError(message);
        setLoading(false);
        return;
      }

      clearSensitiveFields();
      setStatus("success");

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setSignOutFailed(true);
        setAuthError(
          "Sua senha foi atualizada, mas não foi possível encerrar a sessão. Tente ir ao login novamente."
        );
        setLoading(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      clearSensitiveFields();
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

  if (status === "checking") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--at-text-primary)]">
            Redefinir senha
          </h1>
          <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
            Verificando o link de recuperação.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--at-text-secondary)]">
          <LoadingSpinner size="sm" label="Verificando" />
          <span>Aguarde um momento...</span>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
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
        <AppAlert variant="warning">
          Este link de recuperação é inválido ou expirou.
        </AppAlert>
        <p className="text-center text-sm text-[var(--at-text-secondary)]">
          <Link
            href="/recuperar-senha"
            className="text-[var(--at-blue)] font-medium hover:underline"
          >
            Solicitar novo link
          </Link>
        </p>
      </div>
    );
  }

  if (status === "success") {
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
        <AppAlert variant="success">
          Senha atualizada com sucesso. Entre com a nova senha.
        </AppAlert>
        {authError && <AppAlert variant="warning">{authError}</AppAlert>}
        {signOutFailed && (
          <AppButton
            type="button"
            fullWidth
            size="lg"
            onClick={() => void goToLoginAfterSignOut()}
          >
            Ir para o login
          </AppButton>
        )}
      </div>
    );
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

      {authError && <AppAlert variant="warning">{authError}</AppAlert>}

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
            disabled={loading}
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
            disabled={loading}
          />
        </FormField>

        <AppButton type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="sm" label="Atualizando senha" />
              <span className="ml-2">Atualizando...</span>
            </>
          ) : (
            "Atualizar senha"
          )}
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
