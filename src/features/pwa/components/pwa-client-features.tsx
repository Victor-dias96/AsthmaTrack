"use client";

import { ConnectionStatusIndicator } from "./connection-status-indicator";
import { PwaInstallationProvider } from "./pwa-installation-provider";
import { ServiceWorkerRegistration } from "./service-worker-registration";

type PwaClientFeaturesProps = {
  children: React.ReactNode;
};

export function PwaClientFeatures({ children }: PwaClientFeaturesProps) {
  return (
    <PwaInstallationProvider>
      <ServiceWorkerRegistration />
      <ConnectionStatusIndicator />
      {children}
    </PwaInstallationProvider>
  );
}
