import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";

export const metadata: Metadata = {
  title: "Relatório",
};

export default function RelatorioPage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Relatório
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Gere relatórios para compartilhar com seu médico
          </p>
        </div>
        <AppCard>
          <AppCardHeader title="Gerar relatório" description="Em breve" />
          <p className="text-sm text-[var(--at-text-secondary)]">
            Aqui você poderá gerar relatórios dos seus dados para seu médico.
          </p>
        </AppCard>
      </div>
    </PatientShell>
  );
}
