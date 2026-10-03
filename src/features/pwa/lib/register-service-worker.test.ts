import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { startServiceWorkerRegistration } from "./register-service-worker";

type RegisterCall = {
  scriptURL: string;
  options?: { scope?: string };
};

function createHost(options?: {
  readyState?: string;
  serviceWorker?: boolean;
  register?: () => Promise<unknown>;
}) {
  const calls: RegisterCall[] = [];
  const listeners = new Map<string, Set<() => void>>();
  const includeServiceWorker = options?.serviceWorker !== false;

  const host = {
    calls,
    navigator: includeServiceWorker
      ? {
          serviceWorker: {
            register(scriptURL: string, registerOptions?: { scope?: string }) {
              calls.push({ scriptURL, options: registerOptions });
              return options?.register
                ? options.register()
                : Promise.resolve({ scope: "/" });
            },
          },
        }
      : {},
    document: {
      readyState: options?.readyState ?? "complete",
    },
    addEventListener(type: string, listener: () => void) {
      const group = listeners.get(type) ?? new Set<() => void>();
      group.add(listener);
      listeners.set(type, group);
    },
    removeEventListener(type: string, listener: () => void) {
      listeners.get(type)?.delete(listener);
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
    dispatch(type: string) {
      for (const listener of listeners.get(type) ?? []) {
        listener();
      }
    },
  };

  return host;
}

describe("service worker registration", () => {
  test("does nothing when the browser has no service worker", () => {
    const host = createHost({ serviceWorker: false });

    assert.doesNotThrow(() => startServiceWorkerRegistration(host, true));
    assert.equal(host.calls.length, 0);
  });

  test("registers /sw.js once with the root scope after load", () => {
    const host = createHost();
    const stop = startServiceWorkerRegistration(host, true);

    assert.equal(host.calls.length, 1);
    assert.deepEqual(host.calls[0], {
      scriptURL: "/sw.js",
      options: { scope: "/" },
    });
    stop();
    assert.equal(host.calls.length, 1);
  });

  test("waits for load and removes the listener on cleanup", () => {
    const host = createHost({ readyState: "loading" });
    const stop = startServiceWorkerRegistration(host, true);

    assert.equal(host.calls.length, 0);
    assert.equal(host.listenerCount("load"), 1);
    stop();
    assert.equal(host.listenerCount("load"), 0);
    host.dispatch("load");
    assert.equal(host.calls.length, 0);
  });

  test("keeps a rejected registration from breaking the caller", async () => {
    const host = createHost({
      register: () => Promise.reject(new Error("registration blocked")),
    });

    assert.doesNotThrow(() => startServiceWorkerRegistration(host, true));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(host.calls.length, 1);
  });

  test("does not register in development", () => {
    const host = createHost();

    startServiceWorkerRegistration(host, false);
    assert.equal(host.calls.length, 0);
    assert.equal(host.listenerCount("load"), 0);
  });

  test("delivers one registration and ignores it after cleanup", async () => {
    const registration = {
      installing: null,
      waiting: null,
      addEventListener() {},
      removeEventListener() {},
    };
    const host = createHost({
      register: () => Promise.resolve(registration),
    });
    const delivered: unknown[] = [];
    const stop = startServiceWorkerRegistration(host, true, (value) => {
      delivered.push(value);
    });

    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(delivered, [registration]);
    stop();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(delivered.length, 1);
    assert.equal(host.calls.length, 1);
  });

  test("does not deliver a registration resolved after cleanup", async () => {
    let resolveRegister: (value: unknown) => void = () => {};
    const host = createHost({
      register: () =>
        new Promise((resolve) => {
          resolveRegister = resolve;
        }),
    });
    const delivered: unknown[] = [];
    const stop = startServiceWorkerRegistration(host, true, (value) => {
      delivered.push(value);
    });

    stop();
    resolveRegister({
      installing: null,
      waiting: null,
      addEventListener() {},
      removeEventListener() {},
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(delivered, []);
  });
});
