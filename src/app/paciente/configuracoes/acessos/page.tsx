import type { Metadata } from "next";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppAlert } from "@/components/ui/app-alert";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";
import { AuthorizeMedicalTeamMemberForm } from "@/features/access-authorizations";

export const metadata: Metadata = {
  title: "Acesso da equipe médica",
};

// Authorization state is per-patient and mutated on this page; never serve
// it from a cached shell after a previous authorization elsewhere.
export const dynamic = "force-dynamic";

export default function AcessosPage() {
  return (
    <PatientShell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Acesso da equipe médica
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Autorize um integrante da equipe médica a consultar seus dados no
            AsthmaTrack.
          </p>
        </header>

        <AppAlert variant="info">
          Este acesso será somente para consulta. Você poderá revogar o acesso
          posteriormente.
        </AppAlert>

        <AppCard>
          <AppCardHeader
            title="Autorizar profissional"
            description="Informe o código do profissional para localizar e confirmar quem você deseja autorizar."
          />
          <AuthorizeMedicalTeamMemberForm />
        </AppCard>
      </div>
    </PatientShell>
  );
}
