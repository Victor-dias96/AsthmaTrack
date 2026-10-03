"use client";

import { useEffect } from "react";
import { startServiceWorkerRegistration } from "../lib/register-service-worker";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    return startServiceWorkerRegistration(
      window,
      process.env.NODE_ENV === "production"
    );
  }, []);

  return null;
}
