import type { Metadata } from "next";
import Link from "next/link";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";

export const metadata: Metadata = {
  title: "Área da equipe médica",
};

/**
 * Medical-team home page (Issue 106). Deliberately structural only: no
 * patient data, no counts, no authorization-row query. Issue 107 will load
 * the real authorized-patient list under /equipe-medica/pacientes.
 */
export default function EquipeMedicaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
          Área da equipe médica
        </h1>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Consulte os pacientes que autorizaram o acesso aos dados no
          AsthmaTrack.
        </p>
      </div>

      <AppCard>
        <AppCardHeader title="Acompanhamento de pacientes" />
        <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
          Os pacientes com autorização ativa serão exibidos na área de
          pacientes.
        </p>
        <div className="mt-4">
          <Link
            href="/equipe-medica/pacientes"
            className="text-sm font-medium text-[var(--at-blue)] hover:underline"
          >
            Ver pacientes
          </Link>
        </div>
      </AppCard>
    </div>
  );
}
