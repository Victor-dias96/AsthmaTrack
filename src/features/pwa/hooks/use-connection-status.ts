"use client";

import { useEffect, useState } from "react";
import {
  isOnlineFromStatus,
  startConnectionStatus,
  subscribeConnectionNoticeKind,
  type ConnectionNoticeKind,
  type ConnectionStatus,
  type UseConnectionStatusResult,
} from "../lib/connection-status";

export type { ConnectionStatus, UseConnectionStatusResult };

export function useConnectionStatus(): UseConnectionStatusResult {
  const [status, setStatus] = useState<ConnectionStatus>("unknown");

  useEffect(() => {
    return startConnectionStatus(window, setStatus);
  }, []);

  return {
    status,
    isOnline: isOnlineFromStatus(status),
  };
}

export function useConnectionNoticeKind(): ConnectionNoticeKind {
  const [kind, setKind] = useState<ConnectionNoticeKind>("none");

  useEffect(() => {
    return subscribeConnectionNoticeKind(setKind);
  }, []);

  return kind;
}
