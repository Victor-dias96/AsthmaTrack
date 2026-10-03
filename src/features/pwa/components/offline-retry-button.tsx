"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";

export function OfflineRetryButton() {
  const [isPending, setIsPending] = useState(false);

  function handleRetry() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      // Full document load so "/" can run the normal role routing.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch {
      setIsPending(false);
    }
  }

  return (
    <AppButton
      type="button"
      size="lg"
      fullWidth
      onClick={handleRetry}
      disabled={isPending}
      aria-busy={isPending}
      className="motion-reduce:transition-none motion-reduce:active:translate-y-0"
    >
      {isPending ? "Tentando novamente..." : "Tentar novamente"}
    </AppButton>
  );
}
