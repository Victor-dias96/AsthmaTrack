"use client";

import {
  ServiceWorkerUpdateContext,
  useServiceWorkerUpdateOwner,
} from "../hooks/use-service-worker-update";

type ServiceWorkerUpdateProviderProps = {
  children: React.ReactNode;
};

export function ServiceWorkerUpdateProvider({
  children,
}: ServiceWorkerUpdateProviderProps) {
  const value = useServiceWorkerUpdateOwner();

  return (
    <ServiceWorkerUpdateContext.Provider value={value}>
      {children}
    </ServiceWorkerUpdateContext.Provider>
  );
}
