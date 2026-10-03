"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectionStatus } from "../hooks/use-connection-status";
import {
  CONNECTION_RECOVERY_NOTICE_MS,
  INITIAL_CONNECTION_NOTICE,
  OFFLINE_NOTICE_BODY,
  OFFLINE_NOTICE_RECORDS,
  OFFLINE_NOTICE_TITLE,
  RECOVERY_NOTICE_BODY,
  RECOVERY_NOTICE_TITLE,
  connectionNoticeKind,
  dismissConnectionRecovery,
  reduceConnectionNotice,
  type ConnectionNoticeKind,
  type ConnectionNoticeState,
} from "../lib/connection-status";

export function ConnectionStatusIndicator() {
  const pathname = usePathname();
  const { status } = useConnectionStatus();
  const [notice, setNotice] = useState<ConnectionNoticeState>(
    INITIAL_CONNECTION_NOTICE
  );

  if (status !== notice.status) {
    setNotice(reduceConnectionNotice(notice, status));
  }

  useEffect(() => {
    if (!notice.recoveryVisible) {
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) {
        return;
      }

      setNotice((current) => dismissConnectionRecovery(current));
    }, CONNECTION_RECOVERY_NOTICE_MS);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [notice.recoveryVisible]);

  if (pathname === "/offline") {
    return null;
  }

  const kind = connectionNoticeKind(notice, pathname);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "report-print-hidden",
        kind === "none"
          ? "sr-only"
          : "pointer-events-none sticky top-0 z-30 w-full min-w-0 max-w-full bg-[var(--at-bg-app)]"
      )}
      style={
        kind === "none"
          ? undefined
          : {
              paddingTop: "max(0.75rem, env(safe-area-inset-top))",
              paddingRight: "max(1rem, env(safe-area-inset-right))",
              paddingBottom: "0.75rem",
              paddingLeft: "max(1rem, env(safe-area-inset-left))",
            }
      }
    >
      {kind === "offline" ? (
        <ConnectionStatusCard
          tone="offline"
          title={OFFLINE_NOTICE_TITLE}
          body={OFFLINE_NOTICE_BODY}
          detail={OFFLINE_NOTICE_RECORDS}
        />
      ) : null}
      {kind === "recovered" ? (
        <ConnectionStatusCard
          tone="recovered"
          title={RECOVERY_NOTICE_TITLE}
          body={RECOVERY_NOTICE_BODY}
        />
      ) : null}
    </div>
  );
}

function ConnectionStatusCard({
  tone,
  title,
  body,
  detail,
}: {
  tone: Exclude<ConnectionNoticeKind, "none">;
  title: string;
  body: string;
  detail?: string;
}) {
  const offline = tone === "offline";
  const Icon = offline ? WifiOff : Wifi;

  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-xl items-start gap-2.5 rounded-[var(--at-radius-md)] border px-4 py-3 text-sm leading-relaxed shadow-[var(--at-shadow-sm)]",
        offline
          ? "border-[var(--at-alert-border)] bg-[var(--at-alert-bg)] text-[var(--at-alert-text)]"
          : "border-green-200 bg-green-50 text-green-800"
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-4 shrink-0",
          offline ? "text-[var(--at-alert-icon)]" : "text-green-600"
        )}
        size={16}
      />
      <div className="min-w-0">
        <p className="font-semibold break-words">{title}</p>
        <p className="break-words">{body}</p>
        {detail ? <p className="break-words">{detail}</p> : null}
      </div>
    </div>
  );
}
