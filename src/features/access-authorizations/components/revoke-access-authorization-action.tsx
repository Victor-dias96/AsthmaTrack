"use client";

import { useEffect, useRef, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import {
  ACCESS_AUTHORIZATION_REVOKED_NOTICE_PARAM,
  ACCESS_AUTHORIZATION_REVOKED_NOTICE_VALUE,
  ACCESS_MANAGEMENT_PATH,
} from "../constants";
import {
  AUTHORIZATION_VERIFY_CONNECTION_MESSAGE,
  classifyAuthorizationAuthVerification,
} from "../lib/classify-authorization-verification";
import {
  AUTHORIZATION_REVOKE_NO_ROW_MESSAGE,
  classifyAuthorizationRevokeError,
  classifyAuthorizationRevokeNetworkError,
} from "../lib/classify-authorization-revoke-error";
import {
  AUTHORIZATION_REVOKE_INVALID_ID_MESSAGE,
  parseAccessAuthorizationId,
} from "../lib/parse-access-authorization-id";

const AUTH_REDIRECT_DELAY_MS = 2500;

/** Restrained warning styling -- reuses the same tokens as AppAlert's
 * "warning" variant instead of the stronger destructive red used for
 * permanent deletion, since revocation never claims to erase data and can
 * be reversed by a later reauthorization. Never relies on color alone: the
 * icon is decorative (aria-hidden) and "Revogar acesso" is always visible
 * text. */
const triggerClasses = [
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none outline-none",
  "h-9 px-3 text-sm rounded-[var(--at-radius-md)] shrink-0",
  "border border-[var(--at-alert-border)] bg-[var(--at-surface)] text-[var(--at-alert-text)] font-medium",
  "hover:bg-[var(--at-alert-bg)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

const cancelClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

type RevokeAccessAuthorizationActionProps = {
  authorizationId: string;
};

/**
 * Smallest Client Component for Issue 105: lets the authenticated patient
 * revoke one of their own active access authorizations after explicit
 * confirmation.
 *
 * Accepts only the authorization id. The professional's name is already
 * rendered by the parent ActiveAccessItem, so it is never duplicated here
 * (smaller prop API); patientId, professionalId and role are never accepted
 * as props and always come from server-verified identity re-checked
 * immediately before the mutation.
 *
 * Reuses the exact secure revocation mechanism established in Issue 102: a
 * direct, column-restricted UPDATE of `revoked_at`, filtered by id,
 * `patient_id = auth.uid()` and `revoked_at is null`, guarded by RLS and
 * the one-way revocation trigger -- never a competing RPC or a broad table
 * update.
 */
export function RevokeAccessAuthorizationAction({
  authorizationId,
}: RevokeAccessAuthorizationActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  /** Synchronous in-flight guard -- checked before any async work starts,
   * so a rapid double click or an Enter-plus-click cannot fire two
   * requests while React state is still batching the previous update. */
  const isRevokeInFlightRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (isRevokeInFlightRef.current) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  async function handleConfirm() {
    if (isRevokeInFlightRef.current) {
      return;
    }

    const parsedId = parseAccessAuthorizationId(authorizationId);
    if (!parsedId) {
      setError(AUTHORIZATION_REVOKE_INVALID_ID_MESSAGE);
      return;
    }

    isRevokeInFlightRef.current = true;
    setError(null);
    setIsRevoking(true);

    let revoked = false;

    try {
      const supabase = createClient();

      // Reverify the authenticated patient immediately before the
      // mutation -- a prior client-held identity from initial page load is
      // never trusted indefinitely, and patient identity is never derived
      // from the authorization row or accepted from the client.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      const authResult = classifyAuthorizationAuthVerification(
        user,
        authError
      );

      if (authResult.kind === "connection") {
        setError(AUTHORIZATION_VERIFY_CONNECTION_MESSAGE);
        return;
      }

      if (authResult.kind === "unauthenticated") {
        setError(authResult.message);
        window.setTimeout(() => {
          router.replace("/login");
        }, AUTH_REDIRECT_DELAY_MS);
        return;
      }

      const {
        data: revokedRow,
        error: revokeError,
        status: revokeStatus,
      } = await supabase
        .from("patient_access_authorizations")
        // The enforce_patient_access_authorization_revocation trigger (see
        // supabase/migrations/20260904160000_add_patient_access_authorization_policies.sql)
        // discards any client-supplied revoked_at for the authenticated
        // role and always stamps timezone('utc', now()) itself, and
        // separately refuses to change a row whose revoked_at is already
        // non-null. This call only needs to supply a non-null value to
        // request the active -> revoked transition; it never controls the
        // persisted timestamp.
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", parsedId)
        .eq("patient_id", authResult.user.id)
        .is("revoked_at", null)
        .select("id")
        .maybeSingle();

      if (revokeError) {
        const classified = classifyAuthorizationRevokeError(
          revokeError,
          revokeStatus
        );
        setError(classified.message);

        if (classified.kind === "auth") {
          window.setTimeout(() => {
            router.replace("/login");
          }, AUTH_REDIRECT_DELAY_MS);
        }

        return;
      }

      // No row matched id + patient_id + revoked_at is null: it never
      // existed, belongs to another patient, was already revoked, or lost
      // eligibility in a concurrent request. Never distinguish which.
      if (!revokedRow) {
        setError(AUTHORIZATION_REVOKE_NO_ROW_MESSAGE);
        return;
      }

      revoked = true;
      setOpen(false);

      // The active list is server-rendered, so the smallest correct
      // refresh here is navigating back to this same page with a fixed,
      // non-sensitive success token (mirrors
      // src/features/history/lib/get-history-href.ts's deleted-notice
      // convention) and refreshing the server tree, exactly like
      // src/features/history/components/daily-record-delete-action.tsx.
      // This survives this component unmounting once the revoked item
      // leaves the refreshed active list.
      router.replace(
        `${ACCESS_MANAGEMENT_PATH}?${ACCESS_AUTHORIZATION_REVOKED_NOTICE_PARAM}=${ACCESS_AUTHORIZATION_REVOKED_NOTICE_VALUE}`
      );
      router.refresh();
    } catch {
      const classified = classifyAuthorizationRevokeNetworkError();
      setError(classified.message);
    } finally {
      if (!revoked && isMountedRef.current) {
        isRevokeInFlightRef.current = false;
        setIsRevoking(false);
      }
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger
        type="button"
        className={triggerClasses}
        disabled={isRevoking}
      >
        <UserMinus size={15} className="shrink-0" aria-hidden="true" />
        Revogar acesso
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <AlertDialog.Popup
            className={cn(
              "w-full max-w-md min-w-0 rounded-[var(--at-radius-lg)]",
              "border border-[var(--at-border)] bg-[var(--at-surface)]",
              "p-5 shadow-[var(--at-shadow-md)] outline-none",
              "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2"
            )}
            aria-busy={isRevoking}
          >
            <AlertDialog.Title className="text-lg font-semibold text-[var(--at-text-primary)]">
              Revogar acesso?
            </AlertDialog.Title>

            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-[var(--at-text-secondary)]">
              Este integrante da equipe médica deixará de ter autorização
              para consultar seus dados. Essa ação não exclui seus
              registros.
            </AlertDialog.Description>

            {error ? (
              <div id="revoke-access-authorization-error" className="mt-4">
                <AppAlert variant="warning">{error}</AppAlert>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <AlertDialog.Close
                type="button"
                disabled={isRevoking}
                aria-disabled={isRevoking}
                className={cancelClasses}
              >
                Cancelar
              </AlertDialog.Close>

              <AppButton
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={isRevoking}
                aria-disabled={isRevoking}
                aria-busy={isRevoking}
                aria-describedby={
                  error ? "revoke-access-authorization-error" : undefined
                }
                fullWidth
                className="min-w-[10.5rem] sm:w-auto"
              >
                {isRevoking ? (
                  <>
                    <LoadingSpinner size="sm" label="Revogando" />
                    <span className="ml-2">Revogando...</span>
                  </>
                ) : (
                  "Revogar acesso"
                )}
              </AppButton>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
