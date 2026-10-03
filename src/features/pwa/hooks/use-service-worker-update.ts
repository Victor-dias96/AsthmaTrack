"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createBrowserServiceWorkerUpdateHost } from "../lib/create-browser-service-worker-update-host";
import {
  INITIAL_SERVICE_WORKER_UPDATE_SNAPSHOT,
  ServiceWorkerUpdateSession,
  isServiceWorkerRegistrationHandle,
  type ServiceWorkerRegistrationHandle,
  type ServiceWorkerUpdateSnapshot,
} from "../lib/service-worker-update";

export type ServiceWorkerUpdateResult = ServiceWorkerUpdateSnapshot & {
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
};

const IDLE_SERVICE_WORKER_UPDATE: ServiceWorkerUpdateResult = {
  ...INITIAL_SERVICE_WORKER_UPDATE_SNAPSHOT,
  applyUpdate: () => Promise.resolve(),
  dismissUpdate: () => {},
};

type ServiceWorkerUpdateContextValue = {
  result: ServiceWorkerUpdateResult;
  attachRegistration: (registration: unknown) => void;
};

export const ServiceWorkerUpdateContext =
  createContext<ServiceWorkerUpdateContextValue | null>(null);

let mountedOwners = 0;

export function useServiceWorkerUpdateOwner(): ServiceWorkerUpdateContextValue {
  const sessionRef = useRef<ServiceWorkerUpdateSession | null>(null);
  const pendingRegistrationRef = useRef<ServiceWorkerRegistrationHandle | null>(
    null
  );
  const [snapshot, setSnapshot] = useState<ServiceWorkerUpdateSnapshot>(
    INITIAL_SERVICE_WORKER_UPDATE_SNAPSHOT
  );

  useEffect(() => {
    mountedOwners += 1;

    if (mountedOwners > 1) {
      if (process.env.NODE_ENV !== "production") {
        mountedOwners -= 1;
        throw new Error(
          "The service worker update owner must be mounted once."
        );
      }

      return () => {
        mountedOwners -= 1;
      };
    }

    const session = new ServiceWorkerUpdateSession();
    sessionRef.current = session;
    let active = true;
    const unsubscribe = session.subscribe((next) => {
      if (!active) {
        return;
      }

      setSnapshot(next);
    });
    const pending = pendingRegistrationRef.current;

    if (pending) {
      pendingRegistrationRef.current = null;
      session.attach(pending, createBrowserServiceWorkerUpdateHost(window));
    }

    return () => {
      active = false;
      mountedOwners -= 1;
      pendingRegistrationRef.current = null;
      unsubscribe();
      session.stop();
      sessionRef.current = null;
    };
  }, []);

  const applyUpdate = useCallback((): Promise<void> => {
    const session = sessionRef.current;

    if (!session) {
      return Promise.resolve();
    }

    return session.apply();
  }, []);

  const dismissUpdate = useCallback(() => {
    sessionRef.current?.dismiss();
  }, []);

  const attachRegistration = useCallback((registration: unknown) => {
    if (!isServiceWorkerRegistrationHandle(registration)) {
      return;
    }

    const session = sessionRef.current;

    if (!session) {
      pendingRegistrationRef.current = registration;
      return;
    }

    session.attach(registration, createBrowserServiceWorkerUpdateHost(window));
  }, []);

  const result = useMemo<ServiceWorkerUpdateResult>(
    () => ({
      updateAvailable: snapshot.updateAvailable,
      isActivating: snapshot.isActivating,
      errorMessage: snapshot.errorMessage,
      applyUpdate,
      dismissUpdate,
    }),
    [applyUpdate, dismissUpdate, snapshot]
  );

  return useMemo(
    () => ({
      result,
      attachRegistration,
    }),
    [attachRegistration, result]
  );
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdateResult {
  const value = useContext(ServiceWorkerUpdateContext);

  return value?.result ?? IDLE_SERVICE_WORKER_UPDATE;
}

export function useServiceWorkerRegistrationBridge(): (
  registration: unknown
) => void {
  const value = useContext(ServiceWorkerUpdateContext);

  return value?.attachRegistration ?? ignoreRegistration;
}

function ignoreRegistration(): void {}
