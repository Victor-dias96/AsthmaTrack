"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppButton } from "./app-button";

export function BackButton() {
  const router = useRouter();

  return (
    <AppButton
      type="button"
      variant="outline"
      size="md"
      onClick={() => router.back()}
    >
      <ArrowLeft size={16} />
      Voltar
    </AppButton>
  );
}
