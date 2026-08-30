"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/app-button";

export function HistoryRetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRetry() {
    if (isPending) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <AppButton
      type="button"
      onClick={handleRetry}
      disabled={isPending}
      aria-busy={isPending}
      className="w-full sm:w-auto"
    >
      {isPending ? "Tentando novamente..." : "Tentar novamente"}
    </AppButton>
  );
}
