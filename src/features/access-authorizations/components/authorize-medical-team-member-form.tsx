"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

import { PROFESSIONAL_CODE_FIELD_ID } from "../constants";
import { AUTHORIZATION_LOOKUP_NOT_FOUND_MESSAGE } from "../lib/classify-authorization-lookup-error";
import {
  AUTHORIZATION_SELF_MESSAGE,
  AUTHORIZATION_SUCCESS_MESSAGE,
  useAuthorizeMedicalTeamMemberForm,
} from "../hooks/use-authorize-medical-team-member-form";

const cancelClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

/**
 * Smallest interactive Client Component for Issue 103: lets the
 * authenticated patient look up one exact medical-team profile by its
 * shareable professional code and, after an explicit confirmation, create
 * one active `patient_access_authorizations` row. Accepts no props --
 * patientId, tokens and role all come from server-verified identity inside
 * the hook, never from a parent.
 */
export function AuthorizeMedicalTeamMemberForm() {
  const form = useAuthorizeMedicalTeamMemberForm();
  const { flowState } = form;

  return (
    <div className="space-y-4">
      {form.isLookupFormVisible && (
        <form onSubmit={form.handleLookupSubmit} noValidate>
          <FormField
            label="Código do profissional"
            htmlFor={PROFESSIONAL_CODE_FIELD_ID}
            hint="Informe o código compartilhado pelo integrante da equipe médica."
            error={form.fieldError}
            required
          >
            <AppInput
              id={PROFESSIONAL_CODE_FIELD_ID}
              name="professionalCode"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="Ex.: DTJY3K5Z"
              value={form.codeInput}
              onChange={form.onCodeChange}
              hasError={!!form.fieldError}
              disabled={form.isLookingUp}
              maxLength={64}
            />
          </FormField>

          <div className="mt-3">
            <AppButton
              type="submit"
              disabled={form.isLookingUp}
              aria-disabled={form.isLookingUp}
              aria-busy={form.isLookingUp}
            >
              {form.isLookingUp ? (
                <>
                  <LoadingSpinner size="sm" label="Buscando" />
                  <span className="ml-2">Buscando...</span>
                </>
              ) : (
                "Buscar profissional"
              )}
            </AppButton>
          </div>

          <div className="mt-3" aria-live="polite">
            {flowState.kind === "not-found" && (
              <p
                role="status"
                className="text-sm text-[var(--at-text-secondary)]"
              >
                {AUTHORIZATION_LOOKUP_NOT_FOUND_MESSAGE}
              </p>
            )}

            {flowState.kind === "lookup-error" && (
              <AppAlert variant="warning">{flowState.message}</AppAlert>
            )}

            {flowState.kind === "self-match" && (
              <AppAlert variant="warning">
                {AUTHORIZATION_SELF_MESSAGE}
              </AppAlert>
            )}
          </div>
        </form>
      )}

      {(flowState.kind === "found" ||
        flowState.kind === "confirming" ||
        flowState.kind === "authorizing" ||
        flowState.kind === "authorize-error" ||
        flowState.kind === "duplicate") && (
        <div className="rounded-[var(--at-radius-md)] border border-[var(--at-border)] bg-[var(--at-surface-input)] p-4">
          <p className="text-sm font-semibold text-[var(--at-text-primary)]">
            Profissional encontrado
          </p>
          <p className="mt-1 text-sm text-[var(--at-text-secondary)] break-words">
            Nome: {flowState.professional.fullName?.trim() || "Profissional"}
          </p>
          <p className="mt-2 text-sm text-[var(--at-text-secondary)]">
            Confirme se este é o integrante da equipe médica que você deseja
            autorizar. Este acesso será somente para consulta.
          </p>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <AppButton
              type="button"
              variant="outline"
              onClick={form.resetToIdle}
              fullWidth
              className="sm:w-auto"
            >
              Buscar outro código
            </AppButton>

            {flowState.kind === "found" && (
              <AppButton
                type="button"
                onClick={form.handleOpenConfirmation}
                fullWidth
                className="sm:w-auto"
              >
                Autorizar acesso
              </AppButton>
            )}
          </div>
        </div>
      )}

      {flowState.kind === "success" && (
        <div className="space-y-3">
          <AppAlert variant="success">{AUTHORIZATION_SUCCESS_MESSAGE}</AppAlert>
          <p className="text-sm text-[var(--at-text-secondary)]">
            {flowState.professionalFullName?.trim() || "O profissional"} agora
            pode consultar seus dados autorizados em modo somente leitura. Você
            poderá revogar o acesso posteriormente.
          </p>
          <AppButton
            type="button"
            variant="outline"
            onClick={form.handleAuthorizeAnother}
          >
            Autorizar outro profissional
          </AppButton>
        </div>
      )}

      <AlertDialog.Root
        open={form.isDialogOpen}
        onOpenChange={form.handleDialogOpenChange}
      >
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
              aria-busy={form.isAuthorizing}
            >
              <AlertDialog.Title className="text-lg font-semibold text-[var(--at-text-primary)]">
                {flowState.kind === "duplicate"
                  ? "Acesso já concedido"
                  : "Autorizar este profissional?"}
              </AlertDialog.Title>

              <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-[var(--at-text-secondary)]">
                {flowState.kind === "duplicate" ? (
                  "Este profissional já possui acesso ativo aos seus dados."
                ) : (
                  <>
                    Este integrante da equipe médica poderá consultar seus dados
                    autorizados em modo somente leitura. Você poderá revogar o
                    acesso posteriormente.
                  </>
                )}
              </AlertDialog.Description>

              {flowState.kind === "authorize-error" && (
                <div id="authorize-medical-team-member-error" className="mt-4">
                  <AppAlert variant="warning">{flowState.message}</AppAlert>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <AlertDialog.Close
                  type="button"
                  disabled={form.isAuthorizing}
                  aria-disabled={form.isAuthorizing}
                  className={cancelClasses}
                >
                  {flowState.kind === "duplicate" ? "Fechar" : "Cancelar"}
                </AlertDialog.Close>

                {flowState.kind !== "duplicate" && (
                  <AppButton
                    type="button"
                    onClick={form.handleConfirmAuthorize}
                    disabled={form.isAuthorizing}
                    aria-disabled={form.isAuthorizing}
                    aria-busy={form.isAuthorizing}
                    aria-describedby={
                      flowState.kind === "authorize-error"
                        ? "authorize-medical-team-member-error"
                        : undefined
                    }
                    fullWidth
                    className="min-w-[10.5rem] sm:w-auto"
                  >
                    {form.isAuthorizing ? (
                      <>
                        <LoadingSpinner size="sm" label="Autorizando" />
                        <span className="ml-2">Autorizando...</span>
                      </>
                    ) : (
                      "Autorizar acesso"
                    )}
                  </AppButton>
                )}
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
