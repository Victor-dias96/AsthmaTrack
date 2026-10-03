import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  INITIAL_SERVICE_WORKER_UPDATE_SNAPSHOT,
  SERVICE_WORKER_UPDATE_ACTIVATION_TIMEOUT_MS,
  SERVICE_WORKER_UPDATE_ERROR_MESSAGE,
  ServiceWorkerUpdateSession,
  isServiceWorkerRegistrationHandle,
  isServiceWorkerUpdateNoticeVisible,
  type ServiceWorkerHandle,
  type ServiceWorkerRegistrationHandle,
  type ServiceWorkerUpdateHost,
  type ServiceWorkerUpdateSnapshot,
} from "./service-worker-update";

type FakeWorker = ServiceWorkerHandle & {
  messages: unknown[];
  listenerCount: () => number;
  setState: (state: string) => void;
  failPostMessage: boolean;
};

type PendingTimeout = {
  callback: () => void;
  delayMs: number;
  cancelled: boolean;
  fired: boolean;
};

type FakeHost = ServiceWorkerUpdateHost & {
  reloads: number;
  controllerListeners: number;
  timeouts: PendingTimeout[];
  setController: (present: boolean) => void;
  dispatchControllerChange: () => void;
  fireTimeout: () => void;
};

type FakeRegistration = ServiceWorkerRegistrationHandle & {
  dispatchUpdateFound: () => void;
  listenerCount: () => number;
  updateCalls: number;
  update: () => void;
};

function createWorker(state: string): FakeWorker {
  const listeners = new Set<() => void>();
  const worker: FakeWorker = {
    state,
    messages: [],
    failPostMessage: false,
    postMessage(message) {
      if (this.failPostMessage) {
        throw new Error("postMessage blocked");
      }

      this.messages.push(message);
    },
    addEventListener(_type, listener) {
      listeners.add(listener);
    },
    removeEventListener(_type, listener) {
      listeners.delete(listener);
    },
    listenerCount() {
      return listeners.size;
    },
    setState(next) {
      this.state = next;

      for (const listener of [...listeners]) {
        listener();
      }
    },
  };

  return worker;
}

function createRegistration(): FakeRegistration {
  const listeners = new Set<() => void>();
  const registration: FakeRegistration = {
    installing: null,
    waiting: null,
    updateCalls: 0,
    addEventListener(_type, listener) {
      listeners.add(listener);
    },
    removeEventListener(_type, listener) {
      listeners.delete(listener);
    },
    dispatchUpdateFound() {
      for (const listener of [...listeners]) {
        listener();
      }
    },
    listenerCount() {
      return listeners.size;
    },
    update() {
      this.updateCalls += 1;
    },
  };

  return registration;
}

function createHost(controlled: boolean): FakeHost {
  const listeners = new Set<() => void>();
  let controllerPresent = controlled;
  const host: FakeHost = {
    reloads: 0,
    timeouts: [],
    get controllerListeners() {
      return listeners.size;
    },
    hasController() {
      return controllerPresent;
    },
    setController(present) {
      controllerPresent = present;
    },
    addControllerChangeListener(listener) {
      listeners.add(listener);
    },
    removeControllerChangeListener(listener) {
      listeners.delete(listener);
    },
    dispatchControllerChange() {
      for (const listener of [...listeners]) {
        listener();
      }
    },
    reload() {
      this.reloads += 1;
    },
    scheduleTimeout(callback, delayMs) {
      const entry: PendingTimeout = {
        callback,
        delayMs,
        cancelled: false,
        fired: false,
      };
      this.timeouts.push(entry);

      return () => {
        entry.cancelled = true;
      };
    },
    fireTimeout() {
      for (const entry of this.timeouts) {
        if (entry.cancelled || entry.fired) {
          continue;
        }

        entry.fired = true;
        entry.callback();
      }
    },
  };

  return host;
}

function watch(
  session: ServiceWorkerUpdateSession
): ServiceWorkerUpdateSnapshot[] {
  const snapshots: ServiceWorkerUpdateSnapshot[] = [];
  session.subscribe((snapshot) => {
    snapshots.push(snapshot);
  });
  return snapshots;
}

function latest(
  snapshots: ServiceWorkerUpdateSnapshot[]
): ServiceWorkerUpdateSnapshot {
  const snapshot = snapshots[snapshots.length - 1];
  assert.ok(snapshot);
  return snapshot;
}

describe("service worker update notice visibility", () => {
  test("stays hidden for connection notices and appears only when clear", () => {
    assert.equal(
      isServiceWorkerUpdateNoticeVisible({
        updateAvailable: true,
        connectionKind: "offline",
      }),
      false
    );
    assert.equal(
      isServiceWorkerUpdateNoticeVisible({
        updateAvailable: true,
        connectionKind: "recovered",
      }),
      false
    );
    assert.equal(
      isServiceWorkerUpdateNoticeVisible({
        updateAvailable: false,
        connectionKind: "none",
      }),
      false
    );
    assert.equal(
      isServiceWorkerUpdateNoticeVisible({
        updateAvailable: true,
        connectionKind: "none",
      }),
      true
    );
  });

  test("accepts only a registration that can report updates", () => {
    assert.equal(isServiceWorkerRegistrationHandle(null), false);
    assert.equal(isServiceWorkerRegistrationHandle({ scope: "/" }), false);
    assert.equal(
      isServiceWorkerRegistrationHandle({
        installing: null,
        waiting: null,
        addEventListener() {},
        removeEventListener() {},
      }),
      true
    );
  });
});

describe("service worker update detection", () => {
  test("starts idle and treats an existing waiting worker as an update", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const waiting = createWorker("installed");
    const host = createHost(true);
    registration.waiting = waiting;

    assert.deepEqual(snapshots[0], INITIAL_SERVICE_WORKER_UPDATE_SNAPSHOT);
    session.attach(registration, host);

    assert.equal(latest(snapshots).updateAvailable, true);
    assert.equal(latest(snapshots).isActivating, false);
    assert.equal(latest(snapshots).errorMessage, null);
    assert.deepEqual(waiting.messages, []);
    assert.equal(registration.updateCalls, 0);
    assert.equal(host.reloads, 0);
  });

  test("does not treat the first installation as an update", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const installing = createWorker("installing");
    const host = createHost(false);
    registration.installing = installing;

    session.attach(registration, host);
    assert.equal(latest(snapshots).updateAvailable, false);
    installing.setState("installed");
    installing.setState("activating");
    installing.setState("activated");

    assert.equal(latest(snapshots).updateAvailable, false);
    assert.deepEqual(installing.messages, []);
    assert.equal(host.reloads, 0);
  });

  test("shows a notice only after the installing worker is installed", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const host = createHost(true);
    const installing = createWorker("installing");

    session.attach(registration, host);
    registration.installing = installing;
    registration.dispatchUpdateFound();

    assert.equal(installing.listenerCount(), 1);
    assert.equal(latest(snapshots).updateAvailable, false);
    installing.setState("installed");
    registration.waiting = installing;

    assert.equal(latest(snapshots).updateAvailable, true);
    installing.setState("installed");
    assert.equal(
      snapshots.filter((snapshot) => snapshot.updateAvailable).length,
      1
    );
  });

  test("ignores a redundant worker and duplicate updatefound events", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const host = createHost(true);
    const installing = createWorker("installing");

    session.attach(registration, host);
    registration.installing = installing;
    registration.dispatchUpdateFound();
    registration.dispatchUpdateFound();

    assert.equal(installing.listenerCount(), 1);
    installing.setState("redundant");
    assert.equal(latest(snapshots).updateAvailable, false);
    assert.equal(installing.listenerCount(), 0);
  });

  test("hides a dismissed update for this page load without messaging it", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const waiting = createWorker("installed");
    const host = createHost(true);
    registration.waiting = waiting;
    session.attach(registration, host);
    session.dismiss();

    assert.equal(latest(snapshots).updateAvailable, false);
    assert.deepEqual(waiting.messages, []);
    registration.dispatchUpdateFound();
    waiting.setState("installed");
    assert.equal(latest(snapshots).updateAvailable, false);
    assert.equal(registration.updateCalls, 0);

    const next = createWorker("installing");
    registration.installing = next;
    registration.dispatchUpdateFound();
    registration.waiting = next;
    next.setState("installed");
    assert.equal(latest(snapshots).updateAvailable, true);
  });

  test("removes update, state, and controller listeners on cleanup", () => {
    const session = new ServiceWorkerUpdateSession();
    const registration = createRegistration();
    const waiting = createWorker("installed");
    const host = createHost(true);
    registration.waiting = waiting;
    session.attach(registration, host);
    void session.apply();

    assert.equal(registration.listenerCount(), 1);
    assert.equal(waiting.listenerCount(), 1);
    assert.equal(host.controllerListeners, 1);
    session.stop();
    registration.dispatchUpdateFound();
    host.dispatchControllerChange();

    assert.equal(registration.listenerCount(), 0);
    assert.equal(waiting.listenerCount(), 0);
    assert.equal(host.controllerListeners, 0);
    assert.equal(host.reloads, 0);
  });
});

describe("service worker update activation", () => {
  test("sends one skip message and reloads once after controllerchange", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const waiting = createWorker("installed");
    const host = createHost(true);
    registration.waiting = waiting;
    session.attach(registration, host);
    host.dispatchControllerChange();
    assert.equal(host.reloads, 0);

    void session.apply();
    void session.apply();

    assert.equal(latest(snapshots).isActivating, true);
    assert.deepEqual(waiting.messages, [{ type: "SKIP_WAITING" }]);
    assert.equal(Object.keys(waiting.messages[0] as object).length, 1);
    assert.equal(
      host.timeouts[0]?.delayMs,
      SERVICE_WORKER_UPDATE_ACTIVATION_TIMEOUT_MS
    );
    host.dispatchControllerChange();
    host.dispatchControllerChange();

    assert.equal(host.reloads, 1);
    assert.equal(host.timeouts[0]?.cancelled, true);
    assert.equal(registration.updateCalls, 0);
  });

  test("keeps later hidden while activation is in progress", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const waiting = createWorker("installed");
    const host = createHost(true);
    registration.waiting = waiting;
    session.attach(registration, host);
    void session.apply();
    session.dismiss();

    assert.equal(latest(snapshots).isActivating, true);
    assert.equal(latest(snapshots).updateAvailable, true);
    assert.equal(waiting.messages.length, 1);
  });

  test("returns a safe failure when the waiting worker disappears", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const waiting = createWorker("installed");
    const host = createHost(true);
    registration.waiting = waiting;
    session.attach(registration, host);
    registration.waiting = null;
    void session.apply();

    assert.equal(latest(snapshots).isActivating, false);
    assert.equal(latest(snapshots).updateAvailable, true);
    assert.equal(
      latest(snapshots).errorMessage,
      SERVICE_WORKER_UPDATE_ERROR_MESSAGE
    );
    assert.deepEqual(waiting.messages, []);
    assert.equal(host.reloads, 0);
  });

  test("does not reload when messaging fails or the timeout expires", () => {
    const session = new ServiceWorkerUpdateSession();
    const snapshots = watch(session);
    const registration = createRegistration();
    const waiting = createWorker("installed");
    const host = createHost(true);
    registration.waiting = waiting;
    waiting.failPostMessage = true;
    session.attach(registration, host);
    void session.apply();

    assert.equal(
      latest(snapshots).errorMessage,
      SERVICE_WORKER_UPDATE_ERROR_MESSAGE
    );
    assert.equal(latest(snapshots).isActivating, false);
    assert.equal(host.reloads, 0);
    host.dispatchControllerChange();
    assert.equal(host.reloads, 0);

    waiting.failPostMessage = false;
    void session.apply();
    assert.equal(latest(snapshots).isActivating, true);
    assert.equal(waiting.messages.length, 1);
    host.fireTimeout();
    host.dispatchControllerChange();

    assert.equal(host.reloads, 0);
    assert.equal(latest(snapshots).isActivating, false);
    assert.equal(
      latest(snapshots).errorMessage,
      SERVICE_WORKER_UPDATE_ERROR_MESSAGE
    );
    assert.equal(waiting.messages.length, 1);
  });
});
