"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserPwaInstallationHost } from "../lib/create-browser-pwa-installation-host";
import {
  PwaInstallationSession,
  type InstallResult,
  type PwaInstallationSnapshot,
} from "../lib/pwa-installation-session";

export type PwaInstallationState = PwaInstallationSnapshot & {
  install: () => Promise<InstallResult>;
};

const INITIAL_SNAPSHOT: PwaInstallationSnapshot = {
  canInstall: false,
  isInstalled: false,
  isInstalling: false,
  installCompleted: false,
};

let mountedControllers = 0;

/**
 * Browser installation controller. Call it only from
 * PwaInstallationProvider so a single listener owns the deferred event.
 * Install buttons must read the context instead of calling this hook.
 */
export function usePwaInstallation(): PwaInstallationState {
  const sessionRef = useRef<PwaInstallationSession | null>(null);
  const [snapshot, setSnapshot] =
    useState<PwaInstallationSnapshot>(INITIAL_SNAPSHOT);

  useEffect(() => {
    mountedControllers += 1;

    if (mountedControllers > 1) {
      if (process.env.NODE_ENV !== "production") {
        mountedControllers -= 1;
        throw new Error(
          "usePwaInstallation must be mounted once, through PwaInstallationProvider."
        );
      }

      return () => {
        mountedControllers -= 1;
      };
    }

    const session = new PwaInstallationSession(
      createBrowserPwaInstallationHost(window)
    );
    sessionRef.current = session;
    let active = true;

    const unsubscribe = session.subscribe(() => {
      if (!active) {
        return;
      }
      setSnapshot(session.getSnapshot());
    });

    session.start();

    return () => {
      active = false;
      mountedControllers -= 1;
      unsubscribe();
      session.stop();
      sessionRef.current = null;
    };
  }, []);

  const install = useCallback((): Promise<InstallResult> => {
    const session = sessionRef.current;
    if (!session) {
      return Promise.resolve({ status: "unavailable" });
    }

    return session.install();
  }, []);

  return useMemo(
    () => ({
      canInstall: snapshot.canInstall,
      isInstalled: snapshot.isInstalled,
      isInstalling: snapshot.isInstalling,
      installCompleted: snapshot.installCompleted,
      install,
    }),
    [
      snapshot.canInstall,
      snapshot.isInstalled,
      snapshot.isInstalling,
      snapshot.installCompleted,
      install,
    ]
  );
}
