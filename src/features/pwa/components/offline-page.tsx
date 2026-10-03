import Link from "next/link";
import { WifiOff } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { AppLogo } from "@/components/ui/app-logo";
import { OfflineRetryButton } from "./offline-retry-button";

const secondaryActionClasses = [
  "inline-flex min-h-12 w-full items-center justify-center",
  "rounded-[var(--at-radius-md)] px-5 text-base font-medium",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)]",
  "text-[var(--at-text-primary)]",
  "outline-none hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "transition-all duration-150 active:translate-y-px",
  "motion-reduce:transition-none motion-reduce:active:translate-y-0",
].join(" ");

export function OfflinePage() {
  return (
    <main
      className="flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-[var(--at-bg-app)]"
      style={{
        paddingTop: "max(3rem, env(safe-area-inset-top))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "max(3rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
      }}
    >
      <div className="m-auto w-full min-w-0 max-w-md">
        <AppCard padding="none" className="w-full overflow-hidden shadow-sm">
          <div className="bg-[var(--at-navy)] px-6 py-5">
            <AppLogo size="md" className="justify-center" />
          </div>

          <div className="flex flex-col items-center px-6 py-8 text-center sm:px-8">
            <div
              className="flex size-12 items-center justify-center rounded-full bg-[var(--at-blue-light)]"
              aria-hidden="true"
            >
              <WifiOff
                className="size-6 text-[var(--at-blue)]"
                strokeWidth={1.75}
              />
            </div>

            <h1 className="mt-4 text-2xl font-bold break-words text-[var(--at-text-primary)]">
              Sem conexão
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
              Não foi possível acessar o AsthmaTrack porque seu dispositivo está
              offline.
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
              Verifique sua conexão e tente novamente.
            </p>

            <div className="mt-6 flex w-full min-w-0 flex-col items-stretch gap-3">
              <OfflineRetryButton />
              <Link
                href="/"
                prefetch={false}
                className={secondaryActionClasses}
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </AppCard>
      </div>
    </main>
  );
}
