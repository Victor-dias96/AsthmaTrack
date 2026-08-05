import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";

export const metadata: Metadata = {
  title: "Histórico",
};

export default function HistoricoPage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Histórico
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Seus registros anteriores
          </p>
        </div>
        <AppCard>
          <AppCardHeader title="Registros" description="Em breve" />
          <p className="text-sm text-[var(--at-text-secondary)]">
            Seu histórico de sintomas e medições de PEF aparecerá aqui.
          </p>
        </AppCard>
      </div>
    </PatientShell>
  );
}
