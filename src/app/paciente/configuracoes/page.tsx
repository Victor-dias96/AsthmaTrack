import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";

export const metadata: Metadata = {
  title: "Configurações",
};

export default function ConfiguracoesPage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Configurações
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Gerencie seu perfil e preferências
          </p>
        </div>
        <AppCard>
          <AppCardHeader title="Perfil e preferências" description="Em breve" />
          <p className="text-sm text-[var(--at-text-secondary)]">
            As configurações da conta e preferências serão gerenciadas aqui.
          </p>
        </AppCard>
      </div>
    </PatientShell>
  );
}
