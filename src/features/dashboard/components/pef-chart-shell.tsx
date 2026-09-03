"use client";

import { PefEvolutionChart } from "@/features/daily-records/components/pef-evolution-chart";
import type { PefChartPoint } from "../types/pef-chart-point";

export type PefChartShellProps = {
  data: readonly PefChartPoint[];
  titleId: string;
  descriptionId?: string;
};

/**
 * Dashboard wrapper around the shared PEF evolution chart. Supplies
 * dashboard-specific empty, unavailable and accessible copy.
 */
export function PefChartShell({
  data,
  titleId,
  descriptionId,
}: PefChartShellProps) {
  return (
    <PefEvolutionChart
      data={data}
      titleId={titleId}
      descriptionId={descriptionId}
      accessibleLabel="Evolução do PEF"
      emptyMessage="Registre medições para acompanhar a evolução do PEF."
      unavailableMessage="Não foi possível exibir as medições de PEF."
    />
  );
}
