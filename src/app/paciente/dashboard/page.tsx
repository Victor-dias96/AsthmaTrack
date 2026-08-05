import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";

export const metadata: Metadata = {
  title: "Início",
};

export default function DashboardPage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Início
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Bem-vindo ao AsthmaTrack
          </p>
        </div>
        <AppCard>
          <AppCardHeader
            title="Resumo do dia"
            description="Seus dados de hoje aparecerão aqui"
          />
          <p className="text-sm text-[var(--at-text-secondary)]">
            Nenhum registro hoje. Adicione seu primeiro registro do dia.
          </p>
        </AppCard>
      </div>
    </PatientShell>
  );
}
