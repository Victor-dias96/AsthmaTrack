import assert from "node:assert/strict";
import { describe, test } from "node:test";
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
  isOnlineFromStatus,
  readBrowserConnectionStatus,
  reduceConnectionNotice,
  startConnectionStatus,
  type ConnectionNoticeState,
  type ConnectionStatus,
  type ConnectionStatusTarget,
} from "./connection-status";

type Host = ConnectionStatusTarget & {
  dispatch: (type: "online" | "offline") => void;
  listenerCount: (type: "online" | "offline") => number;
  fetchCalls: number;
  storageCalls: number;
};

function createHost(onLine: boolean | "missing" | "throw"): Host {
  const listeners: Record<"online" | "offline", Set<() => void>> = {
    online: new Set(),
    offline: new Set(),
  };

  const host: Host = {
    fetchCalls: 0,
    storageCalls: 0,
    addEventListener(type, listener) {
      listeners[type].add(listener);
    },
    removeEventListener(type, listener) {
      listeners[type].delete(listener);
    },
    dispatch(type) {
      for (const listener of [...listeners[type]]) {
        listener();
      }
    },
    listenerCount(type) {
      return listeners[type].size;
    },
  };

  if (onLine === "throw") {
    host.navigator = {
      get onLine(): boolean {
        throw new Error("unsupported");
      },
    };
    return host;
  }

  if (onLine !== "missing") {
    host.navigator = { onLine };
  }

  return host;
}

describe("connection status", () => {
  test("starts unknown until the browser hint is read", () => {
    assert.equal(INITIAL_CONNECTION_NOTICE.status, "unknown");
    assert.equal(INITIAL_CONNECTION_NOTICE.recoveryVisible, false);
    assert.equal(isOnlineFromStatus("unknown"), null);
    assert.equal(isOnlineFromStatus("online"), true);
    assert.equal(isOnlineFromStatus("offline"), false);
    assert.equal(readBrowserConnectionStatus({}), "unknown");
  });

  test("reads the initial hint without announcing recovery", () => {
    const onlineStatuses: ConnectionStatus[] = [];
    const onlineHost = createHost(true);
    const stopOnline = startConnectionStatus(onlineHost, (status) => {
      onlineStatuses.push(status);
    });

    assert.deepEqual(onlineStatuses, ["online"]);
    assert.equal(onlineHost.listenerCount("online"), 1);
    assert.equal(onlineHost.listenerCount("offline"), 1);
    assert.equal(onlineHost.fetchCalls, 0);
    assert.equal(onlineHost.storageCalls, 0);

    const notice = reduceConnectionNotice(INITIAL_CONNECTION_NOTICE, "online");
    assert.deepEqual(notice, {
      status: "online",
      recoveryVisible: false,
    });
    assert.equal(connectionNoticeKind(notice, "/login"), "none");
    stopOnline();
  });

  test("reads an initial offline hint as the persistent offline notice", () => {
    const statuses: ConnectionStatus[] = [];
    const host = createHost(false);
    const stop = startConnectionStatus(host, (status) => {
      statuses.push(status);
    });

    assert.deepEqual(statuses, ["offline"]);
    const notice = reduceConnectionNotice(INITIAL_CONNECTION_NOTICE, "offline");
    assert.equal(connectionNoticeKind(notice, "/cadastro"), "offline");
    assert.equal(OFFLINE_NOTICE_TITLE, "Você está offline");
    assert.match(OFFLINE_NOTICE_BODY, /indisponíveis/);
    assert.match(OFFLINE_NOTICE_RECORDS, /Alterações em registros exigem/);
    stop();
  });

  test("follows online and offline events and clears recovery when offline returns", () => {
    const statuses: ConnectionStatus[] = [];
    const host = createHost(true);
    const stop = startConnectionStatus(host, (status) => {
      statuses.push(status);
    });

    host.dispatch("offline");
    host.dispatch("online");
    host.dispatch("online");
    host.dispatch("offline");

    assert.deepEqual(statuses, [
      "online",
      "offline",
      "online",
      "online",
      "offline",
    ]);

    let notice: ConnectionNoticeState = INITIAL_CONNECTION_NOTICE;
    const visible: string[] = [];

    for (const status of statuses) {
      notice = reduceConnectionNotice(notice, status);
      visible.push(connectionNoticeKind(notice, "/paciente/dashboard"));
    }

    assert.deepEqual(visible, [
      "none",
      "offline",
      "recovered",
      "recovered",
      "offline",
    ]);
    assert.equal(notice.recoveryVisible, false);
    assert.equal(RECOVERY_NOTICE_TITLE, "Conexão restabelecida");
    assert.match(RECOVERY_NOTICE_BODY, /tentar novamente/);
    assert.equal(CONNECTION_RECOVERY_NOTICE_MS, 5000);
    stop();
    assert.equal(host.listenerCount("online"), 0);
    assert.equal(host.listenerCount("offline"), 0);
  });

  test("ignores events after cleanup and does not use storage or fetch", () => {
    const statuses: ConnectionStatus[] = [];
    const host = createHost(true);
    const stop = startConnectionStatus(host, (status) => {
      statuses.push(status);
    });

    stop();
    host.dispatch("offline");
    host.dispatch("online");

    assert.deepEqual(statuses, ["online"]);
    assert.equal(host.fetchCalls, 0);
    assert.equal(host.storageCalls, 0);
    assert.equal(
      dismissConnectionRecovery({
        status: "online",
        recoveryVisible: true,
      }).recoveryVisible,
      false
    );
    assert.equal(
      dismissConnectionRecovery({
        status: "offline",
        recoveryVisible: false,
      }).status,
      "offline"
    );
  });

  test("fails safely when the browser hint or events are unavailable", () => {
    const thrown: ConnectionStatus[] = [];
    const throwingHost = createHost("throw");
    const stopThrowing = startConnectionStatus(throwingHost, (status) => {
      thrown.push(status);
    });

    assert.deepEqual(thrown, ["unknown"]);
    throwingHost.dispatch("offline");
    assert.deepEqual(thrown, ["unknown", "offline"]);
    stopThrowing();

    const broken: ConnectionStatus[] = [];
    const brokenHost: ConnectionStatusTarget = {
      navigator: { onLine: false },
      addEventListener() {
        throw new Error("unsupported");
      },
      removeEventListener() {
        throw new Error("unsupported");
      },
    };

    assert.doesNotThrow(() => {
      const stop = startConnectionStatus(brokenHost, (status) => {
        broken.push(status);
      });
      stop();
    });
    assert.deepEqual(broken, ["offline"]);
    assert.equal(
      connectionNoticeKind(
        { status: "offline", recoveryVisible: false },
        "/offline"
      ),
      "none"
    );
  });
});
