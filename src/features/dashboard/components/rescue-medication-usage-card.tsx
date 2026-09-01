import { AppCard } from "@/components/ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

import { isDisplayableRescueMedicationUsage } from "../lib/is-displayable-rescue-medication-usage";

export type RescueMedicationUsageCardStatus = "ready" | "loading" | "unavailable";

export type RescueMedicationUsageCardProps = {
  rescueMedicationUsage: number | null;
  status?: RescueMedicationUsageCardStatus;
};

type RescueMedicationUsagePresentation =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "empty" }
  | { kind: "value"; count: number };

function resolveRescueMedicationUsagePresentation(
  rescueMedicationUsage: number | null,
  status: RescueMedicationUsageCardStatus
): RescueMedicationUsagePresentation {
  if (status === "loading") {
    return { kind: "loading" };
  }

  if (status === "unavailable") {
    return { kind: "unavailable" };
  }

  if (rescueMedicationUsage === null) {
    return { kind: "empty" };
  }

  if (!isDisplayableRescueMedicationUsage(rescueMedicationUsage)) {
    return { kind: "unavailable" };
  }

  return { kind: "value", count: rescueMedicationUsage };
}

function formatAccessibleRescueMedicationUsageText(count: number): string {
  if (count === 0) {
    return "Nenhum uso registrado no período selecionado.";
  }

  if (count === 1) {
    return "1 registro com uso de medicação de alívio no período selecionado.";
  }

  return `${count} registros com uso de medicação de alívio no período selecionado.`;
}

function RescueMedicationUsageValue({ count }: { count: number }) {
  const accessibleText = formatAccessibleRescueMedicationUsageText(count);
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

function RescueMedicationUsageEmptyState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Sem dados
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        O uso de medicação de alívio será exibido após a análise dos seus
        registros.
      </p>
    </div>
  );
}

function RescueMedicationUsageUnavailableState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="text-base font-semibold text-[var(--at-text-primary)]">
        Indisponível
      </p>
      <p className="mt-1 text-sm leading-relaxed break-words text-[var(--at-text-secondary)]">
        Não foi possível carregar o uso de medicação de alívio.
      </p>
    </div>
  );
}

function RescueMedicationUsageLoadingState() {
  return (
    <div className="mt-2 min-w-0">
      <p className="sr-only">Carregando uso de medicação de alívio</p>
      <Skeleton className="h-8 w-16 max-w-full" />
    </div>
  );
}

export function RescueMedicationUsageCard({
  rescueMedicationUsage,
  status = "ready",
}: RescueMedicationUsageCardProps) {
  const presentation = resolveRescueMedicationUsagePresentation(
    rescueMedicationUsage,
    status
  );

  return (
    <AppCard padding="sm" className="min-w-0">
      <h3 className="text-sm font-medium text-[var(--at-text-secondary)]">
        Uso de medicação de alívio
      </h3>
      {presentation.kind === "loading" ? (
        <RescueMedicationUsageLoadingState />
      ) : presentation.kind === "unavailable" ? (
        <RescueMedicationUsageUnavailableState />
      ) : presentation.kind === "empty" ? (
        <RescueMedicationUsageEmptyState />
      ) : (
        <RescueMedicationUsageValue count={presentation.count} />
      )}
    </AppCard>
  );
}
