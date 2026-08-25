"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MAX_FULL_NAME_LENGTH } from "@/features/profile/constants";
import { createClient } from "@/lib/supabase/client";

type ProfileSettingsFormProps = {
  initialFullName: string;
  email: string;
  roleLabel: string;
};

export function ProfileSettingsForm({
  initialFullName,
  email,
  roleLabel,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function validateName(value: string): string | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Informe seu nome completo";
    }

    if (trimmed.length > MAX_FULL_NAME_LENGTH) {
      return `O nome deve ter no máximo ${MAX_FULL_NAME_LENGTH} caracteres`;
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setFieldError(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    const validationError = validateName(fullName);
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setIsPending(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const trimmedName = fullName.trim();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: trimmedName })
        .eq("id", user.id);

      if (updateError) {
        if (updateError.code === "PGRST116") {
          setErrorMsg("Perfil não encontrado. Tente fazer login novamente.");
        } else {
          setErrorMsg(
            "Não foi possível salvar suas alterações. Tente novamente."
          );
        }
        return;
      }

      setFullName(trimmedName);
      setSuccessMsg("Nome atualizado com sucesso.");
      router.refresh();
    } catch {
      setErrorMsg(
        "Erro inesperado. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {successMsg && <AppAlert variant="success">{successMsg}</AppAlert>}
      {errorMsg && <AppAlert variant="warning">{errorMsg}</AppAlert>}

      <FormField
        label="Nome completo"
        htmlFor="settings-full-name"
        required
        error={fieldError ?? undefined}
      >
        <AppInput
          id="settings-full-name"
          name="fullName"
          type="text"
          placeholder="Seu nome completo"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          hasError={!!fieldError}
          maxLength={MAX_FULL_NAME_LENGTH}
          disabled={isPending}
          required
        />
      </FormField>

      <FormField label="E-mail" htmlFor="settings-email">
        <AppInput
          id="settings-email"
          name="email"
          type="email"
          value={email}
          readOnly
          disabled
          aria-readonly="true"
        />
      </FormField>

      <FormField label="Tipo de conta" htmlFor="settings-role">
        <AppInput
          id="settings-role"
          name="role"
          type="text"
          value={roleLabel}
          readOnly
          disabled
          aria-readonly="true"
        />
      </FormField>

      <AppButton type="submit" disabled={isPending} aria-disabled={isPending}>
        {isPending ? (
          <>
            <LoadingSpinner size="sm" label="Salvando" />
            <span className="ml-2">Salvando…</span>
          </>
        ) : (
          "Salvar alterações"
        )}
      </AppButton>
    </form>
  );
}
