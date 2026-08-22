"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/app-button";
import { AppAlert } from "@/components/ui/app-alert";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles onboarding completion for the authenticated patient.
 *
 * Responsibilities:
 *  - Resolve the authenticated user via supabase.auth.getUser() (client-side).
 *  - Update ONLY onboarding_completed on the user's own profile row.
 *  - Prevent duplicate submissions while processing.
 *  - Redirect to /paciente/dashboard on success.
 *  - Redirect to /login if no authenticated user is found.
 *  - Display a concise Brazilian Portuguese error message on failure.
 *
 * Out of scope: never sends role, id, or any other field in the update payload.
 * Security: RLS enforces ownership on the server; user ID comes from Auth only.
 */
export function OnboardingForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleComplete() {
    // Prevent duplicate submissions.
    if (isPending) return;

    setIsPending(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();

      // Resolve the authenticated identity from Auth — never from props or URL.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // No authenticated session — send to login.
        router.replace("/login");
        return;
      }

      // Update ONLY the onboarding_completed flag. No role, no id.
      // RLS ensures only the authenticated user can update their own row.
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (updateError) {
        // Surface a safe, user-friendly message — never raw Supabase errors.
        if (updateError.code === "PGRST116") {
          // PostgREST "not found" code
          setErrorMsg("Perfil não encontrado. Tente fazer login novamente.");
        } else {
          setErrorMsg(
            "Não foi possível salvar o progresso. Tente novamente."
          );
        }
        return;
      }

      // Refresh server-component cache so subsequent layouts re-fetch the
      // updated profile, then replace history so the user cannot go back to
      // the onboarding page after completing it.
      router.refresh();
      router.replace("/paciente/dashboard");
    } catch {
      // Handle unexpected errors (network failure, missing config, etc.).
      setErrorMsg("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <AppAlert variant="warning">
          {errorMsg}
        </AppAlert>
      )}

      <AppButton
        fullWidth
        size="lg"
        type="button"
        disabled={isPending}
        aria-disabled={isPending}
        onClick={handleComplete}
      >
        {isPending ? "Aguarde…" : "Começar agora"}
      </AppButton>
    </div>
  );
}
