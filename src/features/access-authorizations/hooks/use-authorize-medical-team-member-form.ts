"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { professionalCodeSchema } from "@/schemas/access-authorization";

import { AUTHORIZATION_AUTH_REDIRECT_DELAY_MS } from "../constants";
import {
  classifyAuthorizationAuthVerification,
  AUTHORIZATION_VERIFY_CONNECTION_MESSAGE,
} from "../lib/classify-authorization-verification";
import {
  classifyAuthorizationInsertError,
  AUTHORIZATION_INSERT_CONNECTION_ERROR_MESSAGE,
} from "../lib/classify-authorization-insert-error";
import {
  classifyAuthorizationLookupError,
  AUTHORIZATION_LOOKUP_CONNECTION_ERROR_MESSAGE,
} from "../lib/classify-authorization-lookup-error";
import {
  mapProfessionalLookupRow,
  parseProfessionalLookupRow,
} from "../lib/map-professional-lookup-row";
import type { ProfessionalSummary } from "../types/professional-summary";

export const AUTHORIZATION_SELF_MESSAGE =
  "Não é possível autorizar a própria conta.";

export const AUTHORIZATION_SUCCESS_MESSAGE = "Acesso autorizado com sucesso.";

/**
 * Discriminated union covering every reachable step of the flow, so states
 * that must never coexist (e.g. "found" and "authorizing", or "success"
 * and "duplicate") cannot be represented at all.
 */
export type AuthorizeFlowState =
  | { kind: "idle" }
  | { kind: "looking-up" }
  | { kind: "not-found" }
  | { kind: "lookup-error"; message: string }
  | { kind: "self-match" }
  | { kind: "found"; professional: ProfessionalSummary }
  | { kind: "confirming"; professional: ProfessionalSummary }
  | { kind: "authorizing"; professional: ProfessionalSummary }
  | {
      kind: "authorize-error";
      professional: ProfessionalSummary;
      message: string;
    }
  | { kind: "duplicate"; professional: ProfessionalSummary }
  | { kind: "success"; professionalFullName: string | null };

const EDITABLE_LOOKUP_STATES = new Set<AuthorizeFlowState["kind"]>([
  "idle",
  "looking-up",
  "not-found",
  "lookup-error",
  "self-match",
]);

export function useAuthorizeMedicalTeamMemberForm() {
  const router = useRouter();

  const [codeInput, setCodeInput] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [flowState, setFlowState] = useState<AuthorizeFlowState>({
    kind: "idle",
  });

  /** Synchronous in-flight guards -- checked before any async work starts,
   * so a rapid double submit can never fire twice while React state is
   * still batching the previous update. */
  const isLookupInFlightRef = useRef(false);
  const isAuthorizeInFlightRef = useRef(false);

  const isLookupFormVisible = EDITABLE_LOOKUP_STATES.has(flowState.kind);
  const isLookingUp = flowState.kind === "looking-up";
  const isDialogOpen =
    flowState.kind === "confirming" ||
    flowState.kind === "authorizing" ||
    flowState.kind === "authorize-error" ||
    flowState.kind === "duplicate";
  const isAuthorizing = flowState.kind === "authorizing";

  function onCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setCodeInput(event.target.value);
    if (fieldError) {
      setFieldError(undefined);
    }
  }

  function resetToIdle() {
    setFieldError(undefined);
    setFlowState({ kind: "idle" });
  }

  /** From the "found" summary card: opens the explicit confirmation dialog.
   * Does not insert anything by itself. */
  function handleOpenConfirmation() {
    if (flowState.kind !== "found") {
      return;
    }
    setFlowState({ kind: "confirming", professional: flowState.professional });
  }

  /** Cancel / Escape / backdrop dismissal. Ignored while an insert is in
   * flight (mirrors the existing delete-confirmation pattern); otherwise
   * returns to the safe "found" summary without inserting anything. */
  function handleDialogOpenChange(nextOpen: boolean) {
    if (nextOpen || isAuthorizeInFlightRef.current) {
      return;
    }

    if (flowState.kind === "duplicate") {
      resetToIdle();
      return;
    }

    if (
      flowState.kind === "confirming" ||
      flowState.kind === "authorize-error"
    ) {
      setFlowState({ kind: "found", professional: flowState.professional });
    }
  }

  async function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLookupInFlightRef.current) {
      return;
    }
    if (!EDITABLE_LOOKUP_STATES.has(flowState.kind)) {
      return;
    }

    const parsed = professionalCodeSchema.safeParse(codeInput);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }

    setFieldError(undefined);
    isLookupInFlightRef.current = true;
    setFlowState({ kind: "looking-up" });

    try {
      const supabase = createClient();

      const {
        data,
        error: lookupError,
        status,
      } = await supabase.rpc("find_medical_professional_by_code", {
        p_code: parsed.data,
      });

      if (lookupError) {
        const classified = classifyAuthorizationLookupError(
          lookupError,
          status
        );
        setFlowState({ kind: "lookup-error", message: classified.message });

        if (classified.kind === "auth") {
          window.setTimeout(() => {
            router.replace("/login");
          }, AUTHORIZATION_AUTH_REDIRECT_DELAY_MS);
        }
        return;
      }

      const row = parseProfessionalLookupRow(data);
      if (!row) {
        setFlowState({ kind: "not-found" });
        return;
      }

      const professional = mapProfessionalLookupRow(row);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      const authResult = classifyAuthorizationAuthVerification(user, authError);

      if (authResult.kind === "connection") {
        setFlowState({
          kind: "lookup-error",
          message: AUTHORIZATION_VERIFY_CONNECTION_MESSAGE,
        });
        return;
      }

      if (authResult.kind === "unauthenticated") {
        setFlowState({
          kind: "lookup-error",
          message: authResult.message,
        });
        window.setTimeout(() => {
          router.replace("/login");
        }, AUTHORIZATION_AUTH_REDIRECT_DELAY_MS);
        return;
      }

      if (authResult.user.id === professional.professionalId) {
        setFlowState({ kind: "self-match" });
        return;
      }

      setFlowState({ kind: "found", professional });
    } catch {
      setFlowState({
        kind: "lookup-error",
        message: AUTHORIZATION_LOOKUP_CONNECTION_ERROR_MESSAGE,
      });
    } finally {
      isLookupInFlightRef.current = false;
    }
  }

  async function handleConfirmAuthorize() {
    if (
      flowState.kind !== "confirming" &&
      flowState.kind !== "authorize-error"
    ) {
      return;
    }
    if (isAuthorizeInFlightRef.current) {
      return;
    }

    // Activate the guard before any auth verification or insert work.
    isAuthorizeInFlightRef.current = true;

    const { professional } = flowState;
    setFlowState({ kind: "authorizing", professional });

    let authorized = false;

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      const authResult = classifyAuthorizationAuthVerification(user, authError);

      if (authResult.kind === "connection") {
        setFlowState({
          kind: "authorize-error",
          professional,
          message: AUTHORIZATION_VERIFY_CONNECTION_MESSAGE,
        });
        return;
      }

      if (authResult.kind === "unauthenticated") {
        setFlowState({
          kind: "authorize-error",
          professional,
          message: authResult.message,
        });
        window.setTimeout(() => {
          router.replace("/login");
        }, AUTHORIZATION_AUTH_REDIRECT_DELAY_MS);
        return;
      }

      // Race-condition safety net; the primary self-authorization guard is
      // the database CHECK constraint and RLS policy, and this was already
      // checked once at lookup time.
      if (authResult.user.id === professional.professionalId) {
        setFlowState({ kind: "self-match" });
        return;
      }

      const { error: insertError, status: insertStatus } = await supabase
        .from("patient_access_authorizations")
        .insert({
          patient_id: authResult.user.id,
          professional_id: professional.professionalId,
        });

      if (insertError) {
        const classified = classifyAuthorizationInsertError(
          insertError,
          insertStatus
        );

        if (classified.kind === "duplicate") {
          setFlowState({ kind: "duplicate", professional });
          return;
        }

        setFlowState({
          kind: "authorize-error",
          professional,
          message: classified.message,
        });

        if (classified.kind === "auth") {
          window.setTimeout(() => {
            router.replace("/login");
          }, AUTHORIZATION_AUTH_REDIRECT_DELAY_MS);
        }
        return;
      }

      authorized = true;
      setCodeInput("");
      setFlowState({
        kind: "success",
        professionalFullName: professional.fullName,
      });
      router.refresh();
    } catch {
      setFlowState({
        kind: "authorize-error",
        professional,
        message: AUTHORIZATION_INSERT_CONNECTION_ERROR_MESSAGE,
      });
    } finally {
      if (!authorized) {
        isAuthorizeInFlightRef.current = false;
      }
    }
  }

  function handleAuthorizeAnother() {
    setCodeInput("");
    isAuthorizeInFlightRef.current = false;
    resetToIdle();
  }

  return {
    codeInput,
    fieldError,
    flowState,
    isLookupFormVisible,
    isLookingUp,
    isDialogOpen,
    isAuthorizing,
    onCodeChange,
    handleLookupSubmit,
    handleOpenConfirmation,
    handleDialogOpenChange,
    handleConfirmAuthorize,
    handleAuthorizeAnother,
    resetToIdle,
  };
}

export type UseAuthorizeMedicalTeamMemberFormResult = ReturnType<
  typeof useAuthorizeMedicalTeamMemberForm
>;
