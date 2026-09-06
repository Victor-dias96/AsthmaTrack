import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppAlert } from "@/components/ui/app-alert";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";
import {
  ActiveAccessSection,
  AuthorizeMedicalTeamMemberForm,
  getPatientActiveAccessAuthorizations,
  readPatientAccessSession,
} from "@/features/access-authorizations";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Acesso da equipe médica",
};

// Authorization state is per-patient and mutated on this page; never serve
// it from a cached shell after a previous authorization elsewhere.
export const dynamic = "force-dynamic";

export default async function AcessosPage() {
  const supabase = await createClient();
  const session = await readPatientAccessSession(supabase);

  if (session.status === "unauthenticated") {
    redirect("/login");
  }

  const activeAccessResult = await getPatientActiveAccessAuthorizations(
    supabase,
    session.userId
  );

  return (
    <PatientShell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header>
          <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
            Acesso da equipe médica
          </h1>
          <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
            Autorize e acompanhe quem pode consultar seus dados no
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

        <ActiveAccessSection {...activeAccessResult} />
      </div>
    </PatientShell>
  );
}
