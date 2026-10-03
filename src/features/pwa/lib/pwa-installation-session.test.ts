import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  PwaInstallationSession,
  type PwaInstallationHost,
} from "./pwa-installation-session";

class FakeHost implements PwaInstallationHost {
  standalone = false;
  displayUnsubscribed = false;
  private readonly listeners = new Map<string, Set<EventListener>>();
  private displayListener: (() => void) | null = null;

  addEventListener(type: string, listener: EventListener): void {
    const set = this.listeners.get(type) ?? new Set<EventListener>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  readStandalone(): boolean {
    return this.standalone;
  }

  subscribeDisplayMode(onChange: () => void): () => void {
    this.displayListener = onChange;
    this.displayUnsubscribed = false;
    return () => {
      this.displayListener = null;
      this.displayUnsubscribed = true;
    };
  }

  dispatch(event: Event): void {
    for (const listener of [...(this.listeners.get(event.type) ?? [])]) {
      listener(event);
    }
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }

  setStandalone(standalone: boolean): void {
    this.standalone = standalone;
    this.displayListener?.();
  }
}

function createPromptEvent(options?: {
  outcome?: "accepted" | "dismissed";
  platform?: string;
  prompt?: () => Promise<void>;
  userChoice?: Promise<unknown>;
}): { event: Event; promptCalls: () => number } {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  let calls = 0;
  const prompt = options?.prompt ?? (async () => {});

  Object.defineProperty(event, "prompt", {
    value: async () => {
      calls += 1;
      await prompt();
    },
  });
  Object.defineProperty(event, "userChoice", {
    value:
      options?.userChoice ??
      Promise.resolve({
        outcome: options?.outcome ?? "accepted",
        platform: options?.platform ?? "test-platform",
      }),
  });

  return {
    event,
    promptCalls: () => calls,
  };
}

function startSession(standalone = false): {
  host: FakeHost;
  session: PwaInstallationSession;
} {
  const host = new FakeHost();
  host.standalone = standalone;
  const session = new PwaInstallationSession(host);
  session.start();
  return { host, session };
}

describe("PwaInstallationSession", () => {
  test("starts with no install opportunity", () => {
    const { session } = startSession();

    assert.deepEqual(session.getSnapshot(), {
      canInstall: false,
      isInstalled: false,
      isInstalling: false,
      installCompleted: false,
    });
  });

  test("captures beforeinstallprompt and prevents the mini-infobar", () => {
    const { host, session } = startSession();
    const prompt = createPromptEvent();

    host.dispatch(prompt.event);

    assert.equal(prompt.event.defaultPrevented, true);
    assert.equal(session.getSnapshot().canInstall, true);
    assert.equal(prompt.promptCalls(), 0);
  });

  test("does not call prompt until install is requested", async () => {
    const { host, session } = startSession();
    const prompt = createPromptEvent({ outcome: "accepted" });

    host.dispatch(prompt.event);
    assert.equal(prompt.promptCalls(), 0);

    const result = await session.install();

    assert.deepEqual(result, { status: "accepted" });
    assert.equal(prompt.promptCalls(), 1);
  });

  test("returns dismissed without treating it as a failure", async () => {
    const { host, session } = startSession();
    const prompt = createPromptEvent({ outcome: "dismissed" });

    host.dispatch(prompt.event);
    const result = await session.install();

    assert.deepEqual(result, { status: "dismissed" });
    assert.equal(session.getSnapshot().canInstall, false);
    assert.equal(session.getSnapshot().isInstalled, false);
    assert.equal(session.getSnapshot().installCompleted, false);
  });

  test("clears the event after use and does not set installed from acceptance", async () => {
    const { host, session } = startSession();
    const prompt = createPromptEvent({ outcome: "accepted" });

    host.dispatch(prompt.event);
    await session.install();

    assert.equal(session.getSnapshot().canInstall, false);
    assert.equal(session.getSnapshot().isInstalled, false);

    const second = await session.install();
    assert.deepEqual(second, { status: "unavailable" });
    assert.equal(prompt.promptCalls(), 1);
  });

  test("calls prompt once when install is activated twice", async () => {
    let releasePrompt: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releasePrompt = resolve;
    });
    const { host, session } = startSession();
    const prompt = createPromptEvent({
      outcome: "accepted",
      prompt: () => gate,
    });

    host.dispatch(prompt.event);

    const first = session.install();
    const second = session.install();
    assert.equal(session.getSnapshot().isInstalling, true);
    assert.equal(session.getSnapshot().canInstall, false);

    releasePrompt();

    const [firstResult, secondResult] = await Promise.all([first, second]);

    assert.deepEqual(firstResult, { status: "accepted" });
    assert.deepEqual(secondResult, { status: "unavailable" });
    assert.equal(prompt.promptCalls(), 1);
  });

  test("appinstalled marks the app installed and hides the action", () => {
    const { host, session } = startSession();
    const prompt = createPromptEvent();

    host.dispatch(prompt.event);
    host.dispatch(new Event("appinstalled"));

    const snapshot = session.getSnapshot();
    assert.equal(snapshot.isInstalled, true);
    assert.equal(snapshot.installCompleted, true);
    assert.equal(snapshot.canInstall, false);
  });

  test("ignores a later beforeinstallprompt after installation", () => {
    const { host, session } = startSession();

    host.dispatch(new Event("appinstalled"));
    const prompt = createPromptEvent();
    host.dispatch(prompt.event);

    assert.equal(prompt.event.defaultPrevented, false);
    assert.equal(session.getSnapshot().canInstall, false);
  });

  test("accepts a fresh event after dismissal", async () => {
    const { host, session } = startSession();
    const first = createPromptEvent({ outcome: "dismissed" });
    host.dispatch(first.event);
    await session.install();

    const second = createPromptEvent({ outcome: "accepted" });
    host.dispatch(second.event);

    assert.equal(session.getSnapshot().canInstall, true);
    assert.deepEqual(await session.install(), { status: "accepted" });
    assert.equal(second.promptCalls(), 1);
  });

  test("returns a safe error when prompt fails and drops the event", async () => {
    const { host, session } = startSession();
    const prompt = createPromptEvent({
      prompt: async () => {
        throw new Error("browser-secret");
      },
    });

    host.dispatch(prompt.event);
    const result = await session.install();

    assert.deepEqual(result, { status: "error" });
    assert.equal(JSON.stringify(result).includes("browser-secret"), false);
    assert.equal(session.getSnapshot().canInstall, false);
    assert.deepEqual(await session.install(), { status: "unavailable" });
  });

  test("returns a safe error when userChoice fails", async () => {
    const userChoice = Promise.reject(new Error("choice-secret"));
    void userChoice.catch(() => {});
    const { host, session } = startSession();
    const prompt = createPromptEvent({ userChoice });

    host.dispatch(prompt.event);

    assert.deepEqual(await session.install(), { status: "error" });
    assert.equal(
      JSON.stringify(session.getSnapshot()).includes("choice-secret"),
      false
    );
    assert.equal(session.getSnapshot().isInstalling, false);
  });

  test("does not throw when the browser never emits an install event", async () => {
    const { session } = startSession();

    await assert.doesNotReject(async () => {
      assert.deepEqual(await session.install(), { status: "unavailable" });
    });
  });

  test("does not throw when the host cannot register events", async () => {
    const host: PwaInstallationHost = {
      addEventListener() {
        throw new Error("unsupported");
      },
      removeEventListener() {
        throw new Error("unsupported");
      },
      readStandalone: () => false,
      subscribeDisplayMode: () => () => {},
    };
    const session = new PwaInstallationSession(host);

    assert.doesNotThrow(() => session.start());
    assert.deepEqual(await session.install(), { status: "unavailable" });
    assert.doesNotThrow(() => session.stop());
  });

  test("hides installation when the app is already standalone", () => {
    const { host, session } = startSession(true);
    const prompt = createPromptEvent();

    host.dispatch(prompt.event);

    assert.equal(session.getSnapshot().isInstalled, true);
    assert.equal(session.getSnapshot().canInstall, false);
    assert.equal(session.getSnapshot().installCompleted, false);
    assert.equal(prompt.event.defaultPrevented, false);
  });

  test("hides installation when display mode changes to standalone", () => {
    const { host, session } = startSession(false);
    const prompt = createPromptEvent();
    host.dispatch(prompt.event);
    assert.equal(session.getSnapshot().canInstall, true);

    host.setStandalone(true);

    assert.equal(session.getSnapshot().isInstalled, true);
    assert.equal(session.getSnapshot().canInstall, false);
    assert.equal(session.getSnapshot().installCompleted, false);
  });

  test("removes listeners on cleanup", () => {
    const { host, session } = startSession();

    assert.equal(host.listenerCount("beforeinstallprompt"), 1);
    assert.equal(host.listenerCount("appinstalled"), 1);

    session.stop();

    assert.equal(host.listenerCount("beforeinstallprompt"), 0);
    assert.equal(host.listenerCount("appinstalled"), 0);
    assert.equal(host.displayUnsubscribed, true);
  });

  test("does not read or write browser storage", async () => {
    const calls: string[] = [];
    const storage = {
      getItem() {
        calls.push("get");
        return null;
      },
      setItem() {
        calls.push("set");
      },
      removeItem() {
        calls.push("remove");
      },
      clear() {
        calls.push("clear");
      },
      key() {
        calls.push("key");
        return null;
      },
      get length() {
        calls.push("length");
        return 0;
      },
    };
    const previous = {
      localStorage: Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
      sessionStorage: Object.getOwnPropertyDescriptor(
        globalThis,
        "sessionStorage"
      ),
    };

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: storage,
    });

    try {
      const { host, session } = startSession();
      const prompt = createPromptEvent({ outcome: "dismissed" });
      host.dispatch(prompt.event);
      await session.install();
      host.dispatch(new Event("appinstalled"));
      session.stop();
      assert.deepEqual(calls, []);
    } finally {
      restoreDescriptor("localStorage", previous.localStorage);
      restoreDescriptor("sessionStorage", previous.sessionStorage);
    }
  });

  test("does not expose platform details on the result", async () => {
    const { host, session } = startSession();
    const prompt = createPromptEvent({
      outcome: "accepted",
      platform: "secret-platform",
    });

    host.dispatch(prompt.event);
    const result = await session.install();

    assert.equal(JSON.stringify(result).includes("secret-platform"), false);
  });
});

function restoreDescriptor(
  key: "localStorage" | "sessionStorage",
  descriptor: PropertyDescriptor | undefined
): void {
  if (descriptor) {
    Object.defineProperty(globalThis, key, descriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, key);
}
