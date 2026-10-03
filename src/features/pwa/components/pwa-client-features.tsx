"use client";

import { PwaInstallationProvider } from "./pwa-installation-provider";
import { ServiceWorkerRegistration } from "./service-worker-registration";

type PwaClientFeaturesProps = {
  children: React.ReactNode;
};

export function PwaClientFeatures({ children }: PwaClientFeaturesProps) {
  return (
    <PwaInstallationProvider>
      <ServiceWorkerRegistration />
      {children}
    </PwaInstallationProvider>
  );
}
