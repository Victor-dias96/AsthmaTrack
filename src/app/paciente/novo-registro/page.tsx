import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";

export const metadata: Metadata = {
  title: "Novo registro",
};

export default function NovoRegistroPage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Novo registro
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Registre seus sintomas e medição de PEF de hoje
          </p>
        </div>
        <AppCard>
          <AppCardHeader
            title="Formulário de registro diário"
            description="Em breve"
          />
          <p className="text-sm text-[var(--at-text-secondary)]">
            O formulário de registro será implementado nesta seção.
          </p>
        </AppCard>
      </div>
    </PatientShell>
  );
}
