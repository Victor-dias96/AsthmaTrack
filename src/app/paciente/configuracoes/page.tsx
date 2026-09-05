import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import { AppAlert } from "@/components/ui/app-alert";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { ProfileSettingsForm } from "@/features/profile/components/profile-settings-form";
import { loadPatientProfile } from "@/features/profile/lib/load-patient-profile";
import { getRoleLabel } from "@/features/profile/lib/role-label";

export const metadata: Metadata = {
  title: "Configurações",
};

function ProfileLoadError() {
  return (
    <AppAlert variant="warning">
      Não foi possível carregar seu perfil. Tente fazer login novamente.
    </AppAlert>
  );
}

export default async function ConfiguracoesPage() {
  const result = await loadPatientProfile();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

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
          <AppCardHeader title="Perfil e preferências" />
          {result.status === "ok" ? (
            <>
              <ProfileSettingsForm
                initialFullName={result.profile.fullName ?? ""}
                email={result.profile.email}
                roleLabel={getRoleLabel(result.profile.role)}
              />

              <div className="mt-6 border-t border-[var(--at-border)] pt-6">
                <h3 className="text-sm font-medium text-[var(--at-text-primary)]">
                  Preferências
                </h3>
                <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
                  As configurações da conta e preferências adicionais serão
                  gerenciadas aqui. Em breve.
                </p>
              </div>
            </>
          ) : (
            <ProfileLoadError />
          )}
        </AppCard>

        <AppCard>
          <AppCardHeader
            title="Equipe médica"
            description="Autorize um integrante da equipe médica a consultar seus dados, somente para leitura."
          />
          <Link
            href="/paciente/configuracoes/acessos"
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--at-radius-md)] border border-[var(--at-border-input)] bg-[var(--at-surface)] px-4 text-sm font-medium text-[var(--at-text-primary)] transition-colors duration-150 hover:bg-[var(--at-surface-input)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2"
          >
            Gerenciar acessos
          </Link>
        </AppCard>

        <AppCard>
          <AppCardHeader title="Sessão" />
          <LogoutButton fullWidth />
        </AppCard>
      </div>
    </PatientShell>
  );
}
