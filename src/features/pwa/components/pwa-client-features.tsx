"use client";

import { ConnectionStatusIndicator } from "./connection-status-indicator";
import { PwaInstallationProvider } from "./pwa-installation-provider";
import { ServiceWorkerRegistration } from "./service-worker-registration";
import { ServiceWorkerUpdateNotice } from "./service-worker-update-notice";
import { ServiceWorkerUpdateProvider } from "./service-worker-update-provider";

type PwaClientFeaturesProps = {
  children: React.ReactNode;
};

export function PwaClientFeatures({ children }: PwaClientFeaturesProps) {
  return (
    <PwaInstallationProvider>
      <ServiceWorkerUpdateProvider>
        <ServiceWorkerRegistration />
        <ConnectionStatusIndicator />
        <ServiceWorkerUpdateNotice />
        {children}
      </ServiceWorkerUpdateProvider>
    </PwaInstallationProvider>
  );
}
