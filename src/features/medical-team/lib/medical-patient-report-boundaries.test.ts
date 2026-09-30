import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const featureRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(featureRoot, "..", "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const reportPage = readRepoFile(
  "src/app/equipe-medica/pacientes/[patientId]/relatorio/page.tsx"
);
const reportContent = readRepoFile(
  "src/features/medical-team/components/medical-patient-report-page-content.tsx"
);
const reportLoader = readRepoFile(
  "src/features/medical-team/server/get-medical-authorized-patient-report-data.ts"
);
const dashboardHeader = readRepoFile(
  "src/features/medical-team/components/medical-patient-dashboard-header.tsx"
);
const patientReportPage = readRepoFile("src/app/paciente/relatorio/page.tsx");

const medicalReportSources = [reportPage, reportContent, reportLoader].join(
  "\n"
);

describe("medical report source boundaries", () => {
  test("keeps the route a dynamic server page with the existing checks", () => {
    assert.match(reportPage, /export const dynamic = "force-dynamic"/);
    assert.match(reportPage, /parseMedicalPatientId/);
    assert.match(reportPage, /readMedicalTeamSession/);
    assert.match(reportPage, /parseReportPeriod/);
    assert.match(reportPage, /notFound\(\)/);
    assert.match(reportPage, /redirect\("\/login"\)/);
    assert.doesNotMatch(reportPage, /"use client"/);
    assert.doesNotMatch(reportPage, /<MedicalTeamShell/);
    assert.doesNotMatch(reportPage, /<PatientShell/);
  });

  test("reuses the existing secure period and latest-record functions", () => {
    assert.match(
      reportLoader,
      /get_medical_authorized_patient_latest_records/
    );
    assert.match(
      reportLoader,
      /get_medical_authorized_patient_period_records/
    );
    assert.match(reportLoader, /getReportPeriodRange/);
    assert.match(reportLoader, /buildMedicalPatientReportSummaries/);
    assert.doesNotMatch(reportLoader, /service_role/);
    assert.doesNotMatch(reportLoader, /\.from\("daily_records"\)/);
    assert.doesNotMatch(reportLoader, /["']notes["']/);
  });

  test("does not add print, PDF, sharing or patient-report delivery", () => {
    assert.doesNotMatch(medicalReportSources, /ReportPrintButton/);
    assert.doesNotMatch(medicalReportSources, /ReportPdfDownloadButton/);
    assert.doesNotMatch(medicalReportSources, /ReportShareButton/);
    assert.doesNotMatch(medicalReportSources, /\/paciente\/relatorio/);
    assert.doesNotMatch(medicalReportSources, /html2canvas/);
    assert.doesNotMatch(medicalReportSources, /report-print-root/);
    assert.match(patientReportPage, /ReportPrintButton/);
    assert.match(patientReportPage, /ReportPdfDownloadButton/);
    assert.match(patientReportPage, /ReportShareButton/);
  });

  test("links the medical dashboard to the medical report route", () => {
    assert.match(dashboardHeader, /Ver relatório/);
    assert.match(dashboardHeader, /getMedicalPatientReportPath/);
    assert.match(dashboardHeader, /Ver histórico/);
    assert.match(dashboardHeader, /Voltar para pacientes/);
  });
});
