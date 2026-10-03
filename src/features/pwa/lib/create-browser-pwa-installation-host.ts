import type { PwaInstallationHost } from "./pwa-installation-session";
import {
  readStandaloneDisplay,
  subscribeStandaloneDisplay,
} from "./read-standalone-display";

export function createBrowserPwaInstallationHost(
  target: Window
): PwaInstallationHost {
  return {
    addEventListener(type, listener) {
      target.addEventListener(type, listener);
    },
    removeEventListener(type, listener) {
      target.removeEventListener(type, listener);
    },
    readStandalone() {
      return readStandaloneDisplay(target);
    },
    subscribeDisplayMode(onChange) {
      return subscribeStandaloneDisplay(target, onChange);
    },
  };
}
