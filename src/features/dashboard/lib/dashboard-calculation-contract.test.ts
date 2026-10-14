import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  ".."
);

function source(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("contrato dos cálculos do dashboard", () => {
  test("paciente e equipe médica usam o mesmo cálculo e a mesma janela", () => {
    const patientLoader = source(
      "src/features/dashboard/lib/load-patient-dashboard-data.ts"
    );
    const medicalLoader = source(
      "src/features/medical-team/server/get-medical-authorized-patient-dashboard-data.ts"
    );
    const patientPage = source("src/app/paciente/dashboard/page.tsx");
    const medicalPage = source(
      "src/app/equipe-medica/pacientes/[patientId]/page.tsx"
    );

    for (const loader of [patientLoader, medicalLoader]) {
      expect(loader).toContain("buildDashboardPeriodMetrics");
      expect(loader).toContain("getHistoryPeriodRange");
      expect(loader).toContain("latestPef: latestRecord.pefValue");
      expect(loader).toContain("latestRecordedAt: latestRecord.recordedAt");
    }

    expect(patientPage).toContain("parseDashboardPeriod");
    expect(medicalPage).toContain("parseDashboardPeriod");
  });

  test("a janela do paciente filtra recorded_at com início inclusivo e fim exclusivo", () => {
    const patientLoader = source(
      "src/features/dashboard/lib/load-patient-dashboard-data.ts"
    );

    expect(patientLoader).toContain('.gte("recorded_at", rangeStart)');
    expect(patientLoader).toContain('.lt("recorded_at", rangeEnd)');
    expect(patientLoader).not.toContain('.gte("created_at"');
    expect(patientLoader).toContain(
      '.order("recorded_at", { ascending: false })'
    );
    expect(patientLoader).toContain(
      '.order("created_at", { ascending: false })'
    );
    expect(patientLoader).toContain('.order("id", { ascending: false })');
    expect(patientLoader).toContain(
      '.order("recorded_at", { ascending: true })'
    );
    expect(patientLoader).toContain('.order("id", { ascending: true })');
  });

  test("a consulta médica ordena por recorded_at e desempata por id", () => {
    const medicalPeriodQuery = source(
      "supabase/migrations/20260908190000_add_medical_authorized_patient_dashboard.sql"
    );

    expect(medicalPeriodQuery).toContain(
      "order by dr.recorded_at desc, dr.id desc"
    );
    expect(medicalPeriodQuery).toContain("dr.recorded_at >= p_range_start");
    expect(medicalPeriodQuery).toContain("dr.recorded_at < p_range_end");
    expect(medicalPeriodQuery).toContain(
      "order by dr.recorded_at asc, dr.id asc"
    );
  });
});
