"use client";

import { RefreshCw } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { useConnectionNoticeKind } from "../hooks/use-connection-status";
import { useServiceWorkerUpdate } from "../hooks/use-service-worker-update";
import {
  SERVICE_WORKER_UPDATE_ACTION,
  SERVICE_WORKER_UPDATE_BODY,
  SERVICE_WORKER_UPDATE_BUSY,
  SERVICE_WORKER_UPDATE_LATER,
  SERVICE_WORKER_UPDATE_TITLE,
  isServiceWorkerUpdateNoticeVisible,
} from "../lib/service-worker-update";

const buttonClassName =
  "h-auto min-h-12 w-full whitespace-normal px-4 py-2.5 sm:w-auto motion-reduce:transition-none motion-reduce:active:translate-y-0";

export function ServiceWorkerUpdateNotice() {
  const update = useServiceWorkerUpdate();
  const connectionKind = useConnectionNoticeKind();
  const visible = isServiceWorkerUpdateNoticeVisible({
    updateAvailable: update.updateAvailable,
    connectionKind,
  });

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={update.isActivating}
      className="report-print-hidden sticky top-0 z-30 w-full min-w-0 max-w-full bg-[var(--at-bg-app)]"
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "0.75rem",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
      }}
    >
      <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-3 rounded-[var(--at-radius-md)] border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-800 shadow-[var(--at-shadow-sm)]">
        <div className="flex min-w-0 items-start gap-2.5">
          <RefreshCw
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-blue-600"
            size={16}
          />
          <div className="min-w-0">
            <p className="font-semibold break-words">
              {SERVICE_WORKER_UPDATE_TITLE}
            </p>
            <p className="break-words">{SERVICE_WORKER_UPDATE_BODY}</p>
            {update.errorMessage ? (
              <p className="break-words">{update.errorMessage}</p>
            ) : null}
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <AppButton
            type="button"
            onClick={() => {
              void update.applyUpdate();
            }}
            disabled={update.isActivating}
            aria-busy={update.isActivating}
            className={buttonClassName}
          >
            {update.isActivating
              ? SERVICE_WORKER_UPDATE_BUSY
              : SERVICE_WORKER_UPDATE_ACTION}
          </AppButton>
          {update.isActivating ? null : (
            <AppButton
              type="button"
              variant="outline"
              onClick={update.dismissUpdate}
              className={buttonClassName}
            >
              {SERVICE_WORKER_UPDATE_LATER}
            </AppButton>
          )}
        </div>
      </div>
    </div>
  );
}
