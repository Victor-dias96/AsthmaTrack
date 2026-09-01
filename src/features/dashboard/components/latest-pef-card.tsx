import Link from "next/link";
import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

import { isDisplayablePefValue } from "../lib/is-displayable-pef-value";

export type LatestPefCardStatus = "ready" | "loading" | "unavailable";

export type LatestPefCardProps = {
  pefValue: number | null;
  status?: LatestPefCardStatus;
};

type LatestPefPresentation =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "empty" }
  | { kind: "value"; value: number };

const measurementLinkClasses = [
  "inline-flex items-center text-sm font-medium text-[var(--at-blue)]",
  "rounded-[var(--at-radius-sm)] underline-offset-4 outline-none",
  "hover:underline",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
].join(" ");

function resolveLatestPefPresentation(
  pefValue: number | null,
  status: LatestPefCardStatus
): LatestPefPresentation {
  if (status === "loading") {
    return { kind: "loading" };
  }

  if (status === "unavailable") {
    return { kind: "unavailable" };
  }

  if (pefValue === null) {
    return { kind: "empty" };
  }

  if (!isDisplayablePefValue(pefValue)) {
    return { kind: "unavailable" };
  }

  return { kind: "value", value: pefValue };
}

function LatestPefValue({ value }: { value: number }) {
  return (
    <p className="mt-2 min-w-0 text-[var(--at-text-primary)]">
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span
        aria-hidden="true"
        className="ml-1 text-sm font-normal text-[var(--at-text-secondary)]"
      >
        L/min
      </span>
      <span className="sr-only"> litros por minuto</span>
    </p>
  );
}

function LatestPefEmptyState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Sem dados
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Registre uma medição para visualizar seu último PEF.
      </p>
      <p className="mt-3">
        <Link href="/paciente/novo-registro" className={measurementLinkClasses}>
          Registrar medição
        </Link>
      </p>
    </div>
  );
}

function LatestPefUnavailableState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Indisponível
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Não foi possível carregar o último PEF.
      </p>
    </div>
  );
}

function LatestPefLoadingState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="sr-only">Carregando último PEF</p>
      <Skeleton className="h-8 w-24 max-w-full" />
    </div>
  );
}

export function LatestPefCard({
  pefValue,
  status = "ready",
}: LatestPefCardProps) {
  const presentation = resolveLatestPefPresentation(pefValue, status);

  return (
    <AppCard padding="sm" className="min-w-0">
      <h3 className="text-sm font-medium text-[var(--at-text-secondary)]">
        Último PEF
      </h3>
      {presentation.kind === "loading" ? (
        <LatestPefLoadingState />
      ) : presentation.kind === "unavailable" ? (
        <LatestPefUnavailableState />
      ) : presentation.kind === "empty" ? (
        <LatestPefEmptyState />
      ) : (
        <LatestPefValue value={presentation.value} />
      )}
    </AppCard>
  );
}
