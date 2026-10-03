export type ServiceWorkerRegistrationEnvironment = {
  navigator: {
    serviceWorker?: {
      register: (
        scriptURL: string,
        options?: { scope?: string }
      ) => Promise<unknown>;
    };
  };
  document: {
    readyState: string;
  };
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

/**
 * Registers /sw.js once, after load, and only in production builds.
 *
 * next dev skips registration so HMR is not stuck behind a stale worker.
 * Verify on localhost with: npm run build && npm run start.
 * If a worker from that production server is still controlling localhost,
 * unregister it in DevTools (Application → Service Workers) and delete only
 * Cache Storage entries whose names start with "asthmatrack-".
 */
export function startServiceWorkerRegistration(
  environment: ServiceWorkerRegistrationEnvironment,
  isProduction: boolean,
  onRegistered?: (registration: unknown) => void
): () => void {
  if (!isProduction || !("serviceWorker" in environment.navigator)) {
    return () => {};
  }

  const serviceWorker = environment.navigator.serviceWorker;

  if (!serviceWorker) {
    return () => {};
  }

  let active = true;

  const register = () => {
    if (!active) {
      return;
    }

    try {
      void serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          if (!active || !onRegistered) {
            return;
          }

          try {
            onRegistered(registration);
          } catch {
            // Update detection must not surface a registration failure.
          }
        })
        .catch(() => {
          // Keep the failure inside the registration promise. Do not log
          // the URL, the session, or anything else from the page.
        });
    } catch {
      // A browser can expose serviceWorker and still reject the call.
    }
  };

  if (environment.document.readyState === "complete") {
    register();

    return () => {
      active = false;
    };
  }

  environment.addEventListener("load", register);

  return () => {
    active = false;
    environment.removeEventListener("load", register);
  };
}
