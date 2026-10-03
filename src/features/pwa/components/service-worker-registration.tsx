"use client";

import { useEffect } from "react";
import { useServiceWorkerRegistrationBridge } from "../hooks/use-service-worker-update";
import { startServiceWorkerRegistration } from "../lib/register-service-worker";

export function ServiceWorkerRegistration() {
  const onRegistered = useServiceWorkerRegistrationBridge();

  useEffect(() => {
    return startServiceWorkerRegistration(
      window,
      process.env.NODE_ENV === "production",
      onRegistered
    );
  }, [onRegistered]);

  return null;
}
