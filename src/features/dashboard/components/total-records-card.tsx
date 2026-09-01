import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

import { isDisplayableTotalRecords } from "../lib/is-displayable-total-records";

export type TotalRecordsCardStatus = "ready" | "loading" | "unavailable";

export type TotalRecordsCardProps = {
  totalRecords: number | null;
  status?: TotalRecordsCardStatus;
};

type TotalRecordsPresentation =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "empty" }
  | { kind: "value"; total: number };

function resolveTotalRecordsPresentation(
  totalRecords: number | null,
  status: TotalRecordsCardStatus
): TotalRecordsPresentation {
  if (status === "loading") {
    return { kind: "loading" };
  }

  if (status === "unavailable") {
    return { kind: "unavailable" };
  }

  if (totalRecords === null) {
    return { kind: "empty" };
  }

  if (!isDisplayableTotalRecords(totalRecords)) {
    return { kind: "unavailable" };
  }

  return { kind: "value", total: totalRecords };
}

function formatAccessibleTotalText(total: number): string {
  if (total === 0) {
    return "Nenhum registro no período selecionado.";
  }

  if (total === 1) {
    return "1 registro no período selecionado.";
  }

  return `${total} registros no período selecionado.`;
}

function TotalRecordsValue({ total }: { total: number }) {
  const accessibleText = formatAccessibleTotalText(total);
  const visibleSupportingText =
    total === 0 ? accessibleText : "No período selecionado";

  return (
    <div
      className="mt-2 min-w-0"
      role="group"
      aria-label={accessibleText}
    >
      <p
        aria-hidden="true"
        className="text-2xl font-bold tabular-nums text-[var(--at-text-primary)]"
      >
        {total}
      </p>
      <p
        aria-hidden="true"
        className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]"
      >
        {visibleSupportingText}
      </p>
    </div>
  );
}

function TotalRecordsEmptyState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Sem dados
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        A quantidade de registros será exibida após a integração dos dados.
      </p>
    </div>
  );
}

function TotalRecordsUnavailableState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Indisponível
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Não foi possível carregar o total de registros.
      </p>
    </div>
  );
}

function TotalRecordsLoadingState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="sr-only">Carregando total de registros</p>
      <Skeleton className="h-8 w-16 max-w-full" />
    </div>
  );
}

export function TotalRecordsCard({
  totalRecords,
  status = "ready",
}: TotalRecordsCardProps) {
  const presentation = resolveTotalRecordsPresentation(totalRecords, status);

  return (
    <AppCard padding="sm" className="min-w-0">
      <h3 className="text-sm font-medium text-[var(--at-text-secondary)]">
        Total de registros
      </h3>
      {presentation.kind === "loading" ? (
        <TotalRecordsLoadingState />
      ) : presentation.kind === "unavailable" ? (
        <TotalRecordsUnavailableState />
      ) : presentation.kind === "empty" ? (
        <TotalRecordsEmptyState />
      ) : (
        <TotalRecordsValue total={presentation.total} />
      )}
    </AppCard>
  );
}
