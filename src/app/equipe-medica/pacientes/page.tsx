import type { Metadata } from "next";
import { AppCard } from "@/components/ui/app-card";

export const metadata: Metadata = {
  title: "Pacientes",
};

/**
 * Minimal structural placeholder for route continuity only (Issue 106).
 * Performs NO Supabase authorization query, shows no count, no fake
 * patients, and no unavailable state pretending a query occurred. The real
 * authorized-patient list is Issue 107's responsibility.
 */
export default function EquipeMedicaPacientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
          Pacientes
        </h1>
      </div>

      <AppCard>
        <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
          Os pacientes que autorizaram o acesso serão exibidos aqui.
        </p>
      </AppCard>
    </div>
  );
}
