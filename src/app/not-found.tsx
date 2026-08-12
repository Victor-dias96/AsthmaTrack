import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/ui/app-logo";
import { AppButton } from "@/components/ui/app-button";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--at-bg-app)] px-4 py-12">
      <div className="w-full max-w-md bg-[var(--at-surface)] rounded-[var(--at-radius-lg)] border border-[var(--at-border)] p-6 sm:p-8 text-center space-y-6 shadow-sm">
        <div className="flex justify-center">
          <AppLogo size="md" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[var(--at-blue-light)] text-[var(--at-blue)]">
            Erro 404
          </span>
          <h1 className="mt-3 text-2xl font-bold text-[var(--at-text-primary)]">
            Página não encontrada
          </h1>
          <p className="mt-2 text-sm text-[var(--at-text-secondary)] leading-relaxed">
            A página que você procurava não foi encontrada ou foi movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/login" className="w-full sm:w-auto">
            <AppButton fullWidth size="md">
              Ir para o início
            </AppButton>
          </Link>
          <div className="w-full sm:w-auto">
            <BackButton />
          </div>
        </div>
      </div>
    </div>
  );
}
