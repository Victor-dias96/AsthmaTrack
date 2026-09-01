import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

import { isDisplayableRecordedAttacks } from "../lib/is-displayable-recorded-attacks";

export type RecordedAttacksCardStatus = "ready" | "loading" | "unavailable";

export type RecordedAttacksCardProps = {
  recordedAttacks: number | null;
  status?: RecordedAttacksCardStatus;
};

type RecordedAttacksPresentation =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "empty" }
  | { kind: "value"; count: number };

function resolveRecordedAttacksPresentation(
  recordedAttacks: number | null,
  status: RecordedAttacksCardStatus
): RecordedAttacksPresentation {
  if (status === "loading") {
    return { kind: "loading" };
  }

  if (status === "unavailable") {
    return { kind: "unavailable" };
  }

  if (recordedAttacks === null) {
    return { kind: "empty" };
  }

  if (!isDisplayableRecordedAttacks(recordedAttacks)) {
    return { kind: "unavailable" };
  }

  return { kind: "value", count: recordedAttacks };
}

function formatAccessibleRecordedAttacksText(count: number): string {
  if (count === 0) {
    return "Nenhuma crise registrada no período selecionado.";
  }

  if (count === 1) {
    return "1 crise registrada no período selecionado.";
  }

  return `${count} crises registradas no período selecionado.`;
}

function RecordedAttacksValue({ count }: { count: number }) {
  const accessibleText = formatAccessibleRecordedAttacksText(count);
  const visibleSupportingText =
    count === 0 ? accessibleText : "No período selecionado";

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
        {count}
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

function RecordedAttacksEmptyState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Sem dados
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        As crises registradas serão exibidas após a análise dos seus registros.
      </p>
    </div>
  );
}

function RecordedAttacksUnavailableState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Indisponível
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Não foi possível carregar as crises registradas.
      </p>
    </div>
  );
}

function RecordedAttacksLoadingState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="sr-only">Carregando crises registradas</p>
      <Skeleton className="h-8 w-16 max-w-full" />
    </div>
  );
}

export function RecordedAttacksCard({
  recordedAttacks,
  status = "ready",
}: RecordedAttacksCardProps) {
  const presentation = resolveRecordedAttacksPresentation(
    recordedAttacks,
    status
  );

  return (
    <AppCard padding="sm" className="min-w-0">
      <h3 className="text-sm font-medium text-[var(--at-text-secondary)]">
        Crises registradas
      </h3>
      {presentation.kind === "loading" ? (
        <RecordedAttacksLoadingState />
      ) : presentation.kind === "unavailable" ? (
        <RecordedAttacksUnavailableState />
      ) : presentation.kind === "empty" ? (
        <RecordedAttacksEmptyState />
      ) : (
        <RecordedAttacksValue count={presentation.count} />
      )}
    </AppCard>
  );
}
