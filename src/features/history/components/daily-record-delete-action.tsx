"use client";

import { useRef, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRouter } from "next/navigation";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  classifyDailyRecordAuthVerification,
  classifyDailyRecordDeleteError,
  classifyDailyRecordDeleteNetworkError,
  classifyDailyRecordDeleteUnexpectedResponse,
  DAILY_RECORD_AUTH_ERROR_MESSAGE,
  DAILY_RECORD_DELETE_CONNECTION_ERROR_MESSAGE,
  DAILY_RECORD_DELETE_NOT_FOUND_ERROR_MESSAGE,
} from "@/features/daily-records/lib/classify-daily-record-submit-error";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const AUTH_REDIRECT_DELAY_MS = 2500;

const triggerClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-destructive bg-[var(--at-surface)] text-destructive font-medium",
  "hover:bg-destructive/5",
  "focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "shrink-0",
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

type DailyRecordDeleteActionProps = {
  recordId: string;
  historyHref: string;
};

export function DailyRecordDeleteAction({
  recordId,
  historyHref,
}: DailyRecordDeleteActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  /** Blocks concurrent deletes before React can rerender `isDeleting`. */
  const isDeleteInFlightRef = useRef(false);

  function handleOpenChange(nextOpen: boolean) {
    if (isDeleteInFlightRef.current) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  async function handleConfirm() {
    if (isDeleteInFlightRef.current) {
      return;
    }

    isDeleteInFlightRef.current = true;
    setError(null);
    setIsDeleting(true);

    let recordDeleted = false;

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      const authResult = classifyDailyRecordAuthVerification(user, authError);

      if (authResult.kind === "connection") {
        setError(DAILY_RECORD_DELETE_CONNECTION_ERROR_MESSAGE);
        return;
      }

      if (authResult.kind === "unauthenticated") {
        setError(DAILY_RECORD_AUTH_ERROR_MESSAGE);
        window.setTimeout(() => {
          router.replace("/login");
        }, AUTH_REDIRECT_DELAY_MS);
        return;
      }

      const {
        data: deletedRow,
        error: deleteError,
        status: deleteStatus,
      } = await supabase
        .from("daily_records")
        .delete()
        .eq("id", recordId)
        .eq("patient_id", authResult.user.id)
        .select("id")
        .maybeSingle();

      if (deleteError) {
        const classified = classifyDailyRecordDeleteError(
          deleteError,
          deleteStatus
        );

        setError(classified.message);

        if (classified.kind === "auth") {
          window.setTimeout(() => {
            router.replace("/login");
          }, AUTH_REDIRECT_DELAY_MS);
        }

        return;
      }

      if (!deletedRow) {
        setError(DAILY_RECORD_DELETE_NOT_FOUND_ERROR_MESSAGE);
        return;
      }

      if (deleteStatus < 200 || deleteStatus >= 300) {
        const classified = classifyDailyRecordDeleteUnexpectedResponse();
        setError(classified.message);
        return;
      }

      recordDeleted = true;
      setOpen(false);
      router.replace(historyHref);
      router.refresh();
    } catch {
      const classified = classifyDailyRecordDeleteNetworkError();
      setError(classified.message);
    } finally {
      if (!recordDeleted) {
        isDeleteInFlightRef.current = false;
        setIsDeleting(false);
      }
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger
        type="button"
        className={triggerClasses}
        disabled={isDeleting}
      >
        Excluir registro
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
            aria-busy={isDeleting}
          >
            <AlertDialog.Title className="text-lg font-semibold text-[var(--at-text-primary)]">
              Excluir este registro?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-[var(--at-text-secondary)]">
              Esta ação não pode ser desfeita. O registro será removido
              permanentemente.
            </AlertDialog.Description>

            {error ? (
              <div id="daily-record-delete-error" className="mt-4">
                <AppAlert variant="warning">{error}</AppAlert>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <AlertDialog.Close
                type="button"
                disabled={isDeleting}
                aria-disabled={isDeleting}
                className={cancelClasses}
              >
                Cancelar
              </AlertDialog.Close>

              <AppButton
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={isDeleting}
                aria-disabled={isDeleting}
                aria-busy={isDeleting}
                aria-describedby={
                  error ? "daily-record-delete-error" : undefined
                }
                fullWidth
                className="min-w-[10.5rem] sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" label="Excluindo" />
                    <span className="ml-2">Excluindo...</span>
                  </>
                ) : (
                  "Excluir registro"
                )}
              </AppButton>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
