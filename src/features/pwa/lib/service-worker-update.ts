import type { ConnectionNoticeKind } from "./connection-status";

export type ServiceWorkerUpdateStatus =
  "idle" | "available" | "activating" | "error";

export type ServiceWorkerUpdateSnapshot = {
  updateAvailable: boolean;
  isActivating: boolean;
  errorMessage: string | null;
};

export type ServiceWorkerUpdateMessage = {
  type: "SKIP_WAITING";
};

export type ServiceWorkerHandle = {
  state: string;
  postMessage(message: ServiceWorkerUpdateMessage): void;
  addEventListener(type: "statechange", listener: () => void): void;
  removeEventListener(type: "statechange", listener: () => void): void;
};

export type ServiceWorkerRegistrationHandle = {
  installing: unknown;
  waiting: unknown;
  addEventListener(type: "updatefound", listener: () => void): void;
  removeEventListener(type: "updatefound", listener: () => void): void;
};

export type ServiceWorkerUpdateHost = {
  hasController(): boolean;
  addControllerChangeListener(listener: () => void): void;
  removeControllerChangeListener(listener: () => void): void;
  reload(): void;
  scheduleTimeout(callback: () => void, delayMs: number): () => void;
};

export const INITIAL_SERVICE_WORKER_UPDATE_SNAPSHOT: ServiceWorkerUpdateSnapshot =
  {
    updateAvailable: false,
    isActivating: false,
    errorMessage: null,
  };

/** Recovers the button if activation never finishes. Never reloads the page. */
export const SERVICE_WORKER_UPDATE_ACTIVATION_TIMEOUT_MS = 10000;

export const SERVICE_WORKER_UPDATE_TITLE = "Nova versão disponível";

export const SERVICE_WORKER_UPDATE_BODY =
  "Atualize o AsthmaTrack para usar a versão mais recente.";

export const SERVICE_WORKER_UPDATE_ACTION = "Atualizar agora";

export const SERVICE_WORKER_UPDATE_LATER = "Depois";

export const SERVICE_WORKER_UPDATE_BUSY = "Atualizando...";

export const SERVICE_WORKER_UPDATE_ERROR_MESSAGE =
  "Não foi possível aplicar a atualização agora. Tente novamente mais tarde.";

export function isServiceWorkerUpdateNoticeVisible(input: {
  updateAvailable: boolean;
  connectionKind: ConnectionNoticeKind;
}): boolean {
  return input.updateAvailable && input.connectionKind === "none";
}

export function isServiceWorkerRegistrationHandle(
  value: unknown
): value is ServiceWorkerRegistrationHandle {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.addEventListener === "function" &&
    typeof value.removeEventListener === "function" &&
    "installing" in value &&
    "waiting" in value
  );
}

/**
 * In-memory owner of one waiting service worker. Dismissal and the worker
 * reference live only for this page load.
 */
export class ServiceWorkerUpdateSession {
  private registration: ServiceWorkerRegistrationHandle | null = null;
  private host: ServiceWorkerUpdateHost | null = null;
  private status: ServiceWorkerUpdateStatus = "idle";
  private dismissed = false;
  private dismissedWorker: ServiceWorkerHandle | null = null;
  private announcedWorker: ServiceWorkerHandle | null = null;
  private watchedWorker: ServiceWorkerHandle | null = null;
  private onCandidateStateChange: (() => void) | null = null;
  private watchingRegistration = false;
  private controllerListening = false;
  private activationSent = false;
  private approved = false;
  private reloaded = false;
  private disposed = false;
  private activationWorker: ServiceWorkerHandle | null = null;
  private cancelActivationTimeout: (() => void) | null = null;
  private snapshot: ServiceWorkerUpdateSnapshot =
    INITIAL_SERVICE_WORKER_UPDATE_SNAPSHOT;
  private readonly listeners = new Set<
    (snapshot: ServiceWorkerUpdateSnapshot) => void
  >();

  subscribe(
    listener: (snapshot: ServiceWorkerUpdateSnapshot) => void
  ): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);

    return () => {
      this.listeners.delete(listener);
    };
  }

  attach(
    registration: ServiceWorkerRegistrationHandle,
    host: ServiceWorkerUpdateHost
  ): void {
    if (this.disposed || this.registration === registration) {
      return;
    }

    this.releaseWatchers();
    this.registration = registration;
    this.host = host;

    try {
      registration.addEventListener("updatefound", this.onUpdateFound);
      this.watchingRegistration = true;
    } catch {
      this.registration = null;
      return;
    }

    const waiting = readWorker(registration.waiting);
    const installing = readWorker(registration.installing);

    if (waiting && host.hasController()) {
      this.watchCandidate(waiting);
    }

    if (installing && installing !== waiting) {
      this.watchCandidate(installing);
    }
  }

  apply(): Promise<void> {
    if (this.activationSent || this.reloaded || this.disposed) {
      return Promise.resolve();
    }

    const worker = readWorker(this.registration?.waiting);

    if (!worker || worker.state === "redundant") {
      if (this.status !== "idle" || this.announcedWorker) {
        this.failActivation();
      }

      return Promise.resolve();
    }

    this.activationSent = true;
    this.approved = true;
    this.activationWorker = worker;
    this.status = "activating";
    this.publish();

    try {
      this.ensureControllerListener();
      this.armTimeout();
      worker.postMessage({ type: "SKIP_WAITING" });
    } catch {
      this.failActivation();
    }

    return Promise.resolve();
  }

  dismiss(): void {
    if (
      this.disposed ||
      this.status === "activating" ||
      (this.status !== "available" && this.status !== "error")
    ) {
      return;
    }

    this.dismissed = true;
    this.dismissedWorker = this.announcedWorker;
    this.publish();
  }

  stop(): void {
    this.disposed = true;
    this.releaseWatchers();
    this.listeners.clear();
  }

  private readonly onUpdateFound = (): void => {
    const installing = readWorker(this.registration?.installing);

    if (!installing) {
      return;
    }

    this.watchCandidate(installing);
  };

  private readonly handleControllerChange = (): void => {
    if (!this.approved || this.reloaded || this.disposed) {
      return;
    }

    this.reloaded = true;
    this.clearActivationTimeout();
    const host = this.host;

    if (!host) {
      this.reloaded = false;
      this.failActivation();
      return;
    }

    try {
      host.reload();
    } catch {
      this.reloaded = false;
      this.failActivation();
    }
  };

  private watchCandidate(worker: ServiceWorkerHandle): void {
    if (this.watchedWorker === worker) {
      this.evaluateCandidate();
      return;
    }

    this.unwatchCandidate();
    const onStateChange = () => {
      this.evaluateCandidate();
    };
    this.watchedWorker = worker;
    this.onCandidateStateChange = onStateChange;

    try {
      worker.addEventListener("statechange", onStateChange);
    } catch {
      this.watchedWorker = null;
      this.onCandidateStateChange = null;
      return;
    }

    this.evaluateCandidate();
  }

  private evaluateCandidate(): void {
    const worker = this.watchedWorker;
    const host = this.host;

    if (!worker || !host) {
      return;
    }

    if (worker.state === "redundant") {
      const announced = this.announcedWorker === worker;
      const activating =
        this.status === "activating" && this.activationWorker === worker;
      this.unwatchCandidate();

      if (activating && !this.reloaded) {
        this.failActivation();
        return;
      }

      if (announced && this.status !== "activating") {
        this.announcedWorker = null;
        this.dismissed = false;
        this.dismissedWorker = null;
        this.status = "idle";
        this.publish();
      }

      return;
    }

    if (worker.state !== "installed") {
      return;
    }

    if (!host.hasController()) {
      return;
    }

    const waiting = readWorker(this.registration?.waiting);

    if (waiting !== null && waiting !== worker) {
      return;
    }

    this.markAvailable(worker);
  }

  private markAvailable(worker: ServiceWorkerHandle): void {
    if (this.reloaded || this.disposed || this.status === "activating") {
      return;
    }

    if (this.dismissed && this.dismissedWorker === worker) {
      this.announcedWorker = worker;
      return;
    }

    if (
      this.announcedWorker === worker &&
      (this.status === "available" || this.status === "error")
    ) {
      return;
    }

    this.announcedWorker = worker;
    this.dismissed = false;
    this.status = "available";
    this.publish();
  }

  private failActivation(): void {
    if (this.reloaded || this.disposed) {
      return;
    }

    this.clearActivationTimeout();
    this.activationSent = false;
    this.approved = false;
    this.activationWorker = null;
    this.status = "error";
    this.publish();
  }

  private ensureControllerListener(): void {
    if (this.controllerListening || !this.host) {
      return;
    }

    this.host.addControllerChangeListener(this.handleControllerChange);
    this.controllerListening = true;
  }

  private armTimeout(): void {
    this.clearActivationTimeout();

    if (!this.host) {
      this.failActivation();
      return;
    }

    this.cancelActivationTimeout = this.host.scheduleTimeout(() => {
      this.cancelActivationTimeout = null;

      if (this.reloaded || this.disposed || this.status !== "activating") {
        return;
      }

      this.failActivation();
    }, SERVICE_WORKER_UPDATE_ACTIVATION_TIMEOUT_MS);
  }

  private clearActivationTimeout(): void {
    if (!this.cancelActivationTimeout) {
      return;
    }

    const cancel = this.cancelActivationTimeout;
    this.cancelActivationTimeout = null;

    try {
      cancel();
    } catch {
      // The timer can already be gone.
    }
  }

  private unwatchCandidate(): void {
    if (this.watchedWorker && this.onCandidateStateChange) {
      try {
        this.watchedWorker.removeEventListener(
          "statechange",
          this.onCandidateStateChange
        );
      } catch {
        // The worker can already be gone.
      }
    }

    this.watchedWorker = null;
    this.onCandidateStateChange = null;
  }

  private releaseWatchers(): void {
    this.unwatchCandidate();
    this.clearActivationTimeout();

    if (this.registration && this.watchingRegistration) {
      try {
        this.registration.removeEventListener(
          "updatefound",
          this.onUpdateFound
        );
      } catch {
        // The registration can already be gone.
      }
    }

    this.watchingRegistration = false;

    if (this.host && this.controllerListening) {
      try {
        this.host.removeControllerChangeListener(this.handleControllerChange);
      } catch {
        // The container can already be gone.
      }
    }

    this.controllerListening = false;
    this.registration = null;
  }

  private publish(): void {
    const next = this.createSnapshot();
    const current = this.snapshot;

    if (
      next.updateAvailable === current.updateAvailable &&
      next.isActivating === current.isActivating &&
      next.errorMessage === current.errorMessage
    ) {
      return;
    }

    this.snapshot = next;

    for (const listener of [...this.listeners]) {
      listener(this.snapshot);
    }
  }

  private createSnapshot(): ServiceWorkerUpdateSnapshot {
    if (this.dismissed || this.status === "idle") {
      return INITIAL_SERVICE_WORKER_UPDATE_SNAPSHOT;
    }

    return {
      updateAvailable: true,
      isActivating: this.status === "activating",
      errorMessage:
        this.status === "error" ? SERVICE_WORKER_UPDATE_ERROR_MESSAGE : null,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isServiceWorkerHandle(value: unknown): value is ServiceWorkerHandle {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.state === "string" &&
    typeof value.postMessage === "function" &&
    typeof value.addEventListener === "function" &&
    typeof value.removeEventListener === "function"
  );
}

function readWorker(value: unknown): ServiceWorkerHandle | null {
  if (!isServiceWorkerHandle(value)) {
    return null;
  }

  return value;
}
