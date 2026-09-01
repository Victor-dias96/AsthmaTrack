import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

import { isDisplayableDaysWithSymptoms } from "../lib/is-displayable-days-with-symptoms";

export type DaysWithSymptomsCardStatus = "ready" | "loading" | "unavailable";

export type DaysWithSymptomsCardProps = {
  daysWithSymptoms: number | null;
  status?: DaysWithSymptomsCardStatus;
};

type DaysWithSymptomsPresentation =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "empty" }
  | { kind: "value"; count: number };

function resolveDaysWithSymptomsPresentation(
  daysWithSymptoms: number | null,
  status: DaysWithSymptomsCardStatus
): DaysWithSymptomsPresentation {
  if (status === "loading") {
    return { kind: "loading" };
  }

  if (status === "unavailable") {
    return { kind: "unavailable" };
  }

  if (daysWithSymptoms === null) {
    return { kind: "empty" };
  }

  if (!isDisplayableDaysWithSymptoms(daysWithSymptoms)) {
    return { kind: "unavailable" };
  }

  return { kind: "value", count: daysWithSymptoms };
}

function formatAccessibleDaysWithSymptomsText(count: number): string {
  if (count === 0) {
    return "Nenhum dia com sintomas no período selecionado.";
  }

  if (count === 1) {
    return "1 dia com sintomas no período selecionado.";
  }

  return `${count} dias com sintomas no período selecionado.`;
}

function DaysWithSymptomsValue({ count }: { count: number }) {
  const accessibleText = formatAccessibleDaysWithSymptomsText(count);
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

function DaysWithSymptomsEmptyState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Sem dados
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Os dias com sintomas serão exibidos após a análise dos seus registros.
      </p>
    </div>
  );
}

function DaysWithSymptomsUnavailableState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Indisponível
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Não foi possível carregar os dias com sintomas.
      </p>
    </div>
  );
}

function DaysWithSymptomsLoadingState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="sr-only">Carregando dias com sintomas</p>
      <Skeleton className="h-8 w-16 max-w-full" />
    </div>
  );
}

export function DaysWithSymptomsCard({
  daysWithSymptoms,
  status = "ready",
}: DaysWithSymptomsCardProps) {
  const presentation = resolveDaysWithSymptomsPresentation(
    daysWithSymptoms,
    status
  );

  return (
    <AppCard padding="sm" className="min-w-0">
      <h3 className="text-sm font-medium text-[var(--at-text-secondary)]">
        Dias com sintomas
      </h3>
      {presentation.kind === "loading" ? (
        <DaysWithSymptomsLoadingState />
      ) : presentation.kind === "unavailable" ? (
        <DaysWithSymptomsUnavailableState />
      ) : presentation.kind === "empty" ? (
        <DaysWithSymptomsEmptyState />
      ) : (
        <DaysWithSymptomsValue count={presentation.count} />
      )}
    </AppCard>
  );
}
