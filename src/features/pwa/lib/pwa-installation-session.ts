import {
  isBeforeInstallPromptEvent,
  type BeforeInstallPromptEvent,
} from "../types/before-install-prompt-event";

export type InstallResult =
  | { status: "accepted" }
  | { status: "dismissed" }
  | { status: "unavailable" }
  | { status: "error" };

export type PwaInstallationSnapshot = {
  canInstall: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  installCompleted: boolean;
};

export type PwaInstallationHost = {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  readStandalone(): boolean;
  subscribeDisplayMode(onChange: () => void): () => void;
};

const INITIAL_SNAPSHOT: PwaInstallationSnapshot = {
  canInstall: false,
  isInstalled: false,
  isInstalling: false,
  installCompleted: false,
};

/**
 * In-memory owner of one deferred installation event. The event is
 * single-use, is never written to browser storage, and is cleared as soon
 * as a prompt starts so a second activation cannot call prompt() again.
 */
export class PwaInstallationSession {
  private deferred: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private promptInFlight = false;
  private installCompleted = false;
  private started = false;
  private disposed = false;
  private removeDisplayMode: (() => void) | undefined;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly host: PwaInstallationHost) {}

  start(): void {
    if (this.started || this.disposed) {
      return;
    }

    this.started = true;

    try {
      this.removeDisplayMode = this.host.subscribeDisplayMode(() => {
        this.applyStandaloneReading();
      });
      this.host.addEventListener(
        "beforeinstallprompt",
        this.handleBeforeInstallPrompt
      );
      this.host.addEventListener("appinstalled", this.handleAppInstalled);
      this.applyStandaloneReading();
    } catch {
      // Missing browser events are a capability gap, not an application error.
    }
  }

  stop(): void {
    this.disposed = true;
    this.deferred = null;
    this.listeners.clear();

    try {
      this.host.removeEventListener(
        "beforeinstallprompt",
        this.handleBeforeInstallPrompt
      );
    } catch {
      // The browsing context may already have dropped the listener.
    }

    try {
      this.host.removeEventListener("appinstalled", this.handleAppInstalled);
    } catch {
      // The browsing context may already have dropped the listener.
    }

    try {
      this.removeDisplayMode?.();
    } catch {
      // The media query list may already be gone.
    }

    this.removeDisplayMode = undefined;
  }

  subscribe(listener: () => void): () => void {
    if (this.disposed) {
      return () => {};
    }

    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): PwaInstallationSnapshot {
    if (!this.started) {
      return INITIAL_SNAPSHOT;
    }

    return {
      canInstall:
        this.deferred !== null && !this.isInstalled && !this.promptInFlight,
      isInstalled: this.isInstalled,
      isInstalling: this.promptInFlight,
      installCompleted: this.installCompleted,
    };
  }

  async install(): Promise<InstallResult> {
    if (this.disposed || this.promptInFlight || this.isInstalled) {
      return { status: "unavailable" };
    }

    const event = this.deferred;
    if (!event) {
      return { status: "unavailable" };
    }

    this.promptInFlight = true;
    this.deferred = null;
    this.emit();

    try {
      await event.prompt();
      const outcome = readChoiceOutcome(await event.userChoice);

      if (outcome === "accepted" || outcome === "dismissed") {
        return { status: outcome };
      }

      return { status: "error" };
    } catch {
      return { status: "error" };
    } finally {
      this.promptInFlight = false;
      if (!this.disposed) {
        this.emit();
      }
    }
  }

  private readonly handleBeforeInstallPrompt = (event: Event): void => {
    if (this.disposed || this.isInstalled || this.promptInFlight) {
      return;
    }

    if (!isBeforeInstallPromptEvent(event)) {
      return;
    }

    try {
      event.preventDefault();
    } catch {
      return;
    }

    this.deferred = event;
    this.emit();
  };

  private readonly handleAppInstalled = (): void => {
    if (this.disposed) {
      return;
    }

    this.deferred = null;
    this.installCompleted = true;
    this.isInstalled = true;
    this.emit();
  };

  private applyStandaloneReading(): void {
    if (this.disposed) {
      return;
    }

    let standalone = false;

    try {
      standalone = this.host.readStandalone();
    } catch {
      standalone = false;
    }

    if (standalone) {
      this.isInstalled = true;
      this.deferred = null;
    } else if (!this.installCompleted) {
      this.isInstalled = false;
    }

    this.emit();
  }

  private emit(): void {
    if (this.disposed) {
      return;
    }

    for (const listener of this.listeners) {
      listener();
    }
  }
}

function readChoiceOutcome(choice: unknown): "accepted" | "dismissed" | null {
  if (typeof choice !== "object" || choice === null || !("outcome" in choice)) {
    return null;
  }

  if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
    return choice.outcome;
  }

  return null;
}
