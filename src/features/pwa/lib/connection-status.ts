export type ConnectionStatus = "unknown" | "online" | "offline";

export type UseConnectionStatusResult = {
  status: ConnectionStatus;
  isOnline: boolean | null;
};

export type ConnectionStatusTarget = {
  navigator?: {
    onLine?: boolean;
  };
  addEventListener: (type: "online" | "offline", listener: () => void) => void;
  removeEventListener: (
    type: "online" | "offline",
    listener: () => void
  ) => void;
};

export type ConnectionNoticeState = {
  status: ConnectionStatus;
  recoveryVisible: boolean;
};

export const INITIAL_CONNECTION_NOTICE: ConnectionNoticeState = {
  status: "unknown",
  recoveryVisible: false,
};

/** Brief recovery feedback. The offline notice is not dismissed by a timer. */
export const CONNECTION_RECOVERY_NOTICE_MS = 5000;

export const OFFLINE_NOTICE_TITLE = "Você está offline";

export const OFFLINE_NOTICE_BODY =
  "Alguns recursos podem ficar indisponíveis até a conexão retornar.";

export const OFFLINE_NOTICE_RECORDS =
  "Alterações em registros exigem conexão com a internet.";

export const RECOVERY_NOTICE_TITLE = "Conexão restabelecida";

export const RECOVERY_NOTICE_BODY =
  "Você pode tentar novamente as ações que exigem internet.";

export type ConnectionNoticeKind = "none" | "offline" | "recovered";

/**
 * Reads the browser connectivity hint. `true` only means the network may be
 * available. It does not prove server, Supabase, or mutation reachability.
 */
export function readBrowserConnectionStatus(
  target: Pick<ConnectionStatusTarget, "navigator">
): ConnectionStatus {
  try {
    const onLine = target.navigator?.onLine;

    if (onLine === true) {
      return "online";
    }

    if (onLine === false) {
      return "offline";
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

export function isOnlineFromStatus(status: ConnectionStatus): boolean | null {
  if (status === "unknown") {
    return null;
  }

  return status === "online";
}

/**
 * Subscribes once to browser online and offline events. The caller must
 * invoke the returned cleanup so both listeners are removed.
 */
export function startConnectionStatus(
  target: ConnectionStatusTarget,
  onStatus: (status: ConnectionStatus) => void
): () => void {
  let active = true;

  const publish = (status: ConnectionStatus) => {
    if (!active) {
      return;
    }

    onStatus(status);
  };

  const handleOnline = () => {
    publish("online");
  };

  const handleOffline = () => {
    publish("offline");
  };

  publish(readBrowserConnectionStatus(target));

  let removeOnline: (() => void) | null = null;
  let removeOffline: (() => void) | null = null;

  try {
    target.addEventListener("online", handleOnline);
    removeOnline = () => {
      target.removeEventListener("online", handleOnline);
    };
  } catch {
    removeOnline = null;
  }

  try {
    target.addEventListener("offline", handleOffline);
    removeOffline = () => {
      target.removeEventListener("offline", handleOffline);
    };
  } catch {
    removeOffline = null;
  }

  return () => {
    active = false;

    try {
      removeOnline?.();
    } catch {
      // The host can disappear before cleanup.
    }

    try {
      removeOffline?.();
    } catch {
      // The host can disappear before cleanup.
    }
  };
}

export function reduceConnectionNotice(
  current: ConnectionNoticeState,
  nextStatus: ConnectionStatus
): ConnectionNoticeState {
  if (nextStatus === current.status) {
    return current;
  }

  if (nextStatus === "offline") {
    return {
      status: "offline",
      recoveryVisible: false,
    };
  }

  if (current.status === "offline" && nextStatus === "online") {
    return {
      status: "online",
      recoveryVisible: true,
    };
  }

  return {
    status: nextStatus,
    recoveryVisible: false,
  };
}

export function dismissConnectionRecovery(
  current: ConnectionNoticeState
): ConnectionNoticeState {
  if (!current.recoveryVisible || current.status !== "online") {
    return current;
  }

  return {
    status: "online",
    recoveryVisible: false,
  };
}

export function connectionNoticeKind(
  state: ConnectionNoticeState,
  pathname: string
): ConnectionNoticeKind {
  if (pathname === "/offline") {
    return "none";
  }

  if (state.status === "offline") {
    return "offline";
  }

  if (state.recoveryVisible && state.status === "online") {
    return "recovered";
  }

  return "none";
}
