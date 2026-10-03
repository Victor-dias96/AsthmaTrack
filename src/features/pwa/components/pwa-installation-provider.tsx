"use client";

import { createContext, useContext } from "react";
import {
  usePwaInstallation,
  type PwaInstallationState,
} from "../hooks/use-pwa-installation";

const PwaInstallationContext = createContext<PwaInstallationState | null>(null);

const UNAVAILABLE_INSTALLATION: PwaInstallationState = {
  canInstall: false,
  isInstalled: false,
  isInstalling: false,
  installCompleted: false,
  install: () => Promise.resolve({ status: "unavailable" }),
};

type PwaInstallationProviderProps = {
  children: React.ReactNode;
};

export function PwaInstallationProvider({
  children,
}: PwaInstallationProviderProps) {
  const installation = usePwaInstallation();

  return (
    <PwaInstallationContext.Provider value={installation}>
      {children}
    </PwaInstallationContext.Provider>
  );
}

export function usePwaInstallationContext(): PwaInstallationState {
  const installation = useContext(PwaInstallationContext);

  if (!installation) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "usePwaInstallationContext must be used within PwaInstallationProvider."
      );
    }

    return UNAVAILABLE_INSTALLATION;
  }

  return installation;
}
