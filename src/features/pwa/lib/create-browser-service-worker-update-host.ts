import type { ServiceWorkerUpdateHost } from "./service-worker-update";

/**
 * Browser adapter for one already-registered service worker. It does not
 * call register(), update(), or reload on its own.
 */
export function createBrowserServiceWorkerUpdateHost(
  target: Window
): ServiceWorkerUpdateHost {
  const container = target.navigator.serviceWorker;

  return {
    hasController() {
      try {
        return container.controller != null;
      } catch {
        return false;
      }
    },
    addControllerChangeListener(listener) {
      container.addEventListener("controllerchange", listener);
    },
    removeControllerChangeListener(listener) {
      container.removeEventListener("controllerchange", listener);
    },
    reload() {
      target.location.reload();
    },
    scheduleTimeout(callback, delayMs) {
      const timeoutId = target.setTimeout(callback, delayMs);

      return () => {
        target.clearTimeout(timeoutId);
      };
    },
  };
}
