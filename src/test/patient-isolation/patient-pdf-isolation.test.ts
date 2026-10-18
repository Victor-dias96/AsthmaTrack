// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { GET } from "@/app/paciente/relatorio/pdf/route";
import { PatientReportPdfDocument } from "@/features/reports/pdf/patient-report-pdf-document";
import type { PatientReportPdfData } from "@/features/reports/types/patient-report-pdf-data";

import {
  PATIENT_A_ID,
  PATIENT_A_NAME,
  PATIENT_A_PEF_VALUES,
  PATIENT_A_RECORD_1_ID,
  PATIENT_B_ID,
  PATIENT_B_NAME,
  PATIENT_B_NOTES,
  PATIENT_B_PEF_VALUES,
  PATIENT_B_RECORD_1_ID,
  PATIENT_B_RECORD_2_ID,
  buildDailyRecordFixtures,
  buildProfileFixtures,
} from "./fixtures";
import {
  UnrestrictedSupabaseFake,
  asSupabaseClient,
} from "./unrestricted-supabase-fake";

const state = vi.hoisted(() => ({
  fake: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.fake,
}));

// Only the binary rendering step is replaced; the route still builds the
// real PDF data model, which is what the document receives.
vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: vi.fn(async () => Buffer.from("%PDF-1.4 ficticio")),
}));

vi.mock("@/features/reports/pdf/patient-report-pdf-document", () => ({
  PatientReportPdfDocument: vi.fn(() => null),
}));

const PDF_URL = "http://localhost:3000/paciente/relatorio/pdf";

let fake: UnrestrictedSupabaseFake;

function hasNumber(text: string, value: number): boolean {
  return new RegExp(`(^|\\D)${value}(\\D|$)`).test(text);
}

function requestPdf(query: string) {
  return GET(new NextRequest(`${PDF_URL}?${query}`));
}

function renderedPdfData(): PatientReportPdfData {
  const calls = vi.mocked(PatientReportPdfDocument).mock.calls;
  expect(calls).toHaveLength(1);
  return calls[0][0].data;
}

beforeEach(() => {
  vi.mocked(PatientReportPdfDocument).mockClear();
  fake = new UnrestrictedSupabaseFake({
    daily_records: buildDailyRecordFixtures(new Date()),
    profiles: buildProfileFixtures(),
  });
  state.fake = asSupabaseClient(fake);
});

describe("isolamento entre pacientes: PDF do relatório", () => {
  test("parâmetros forjados não ampliam o PDF do paciente A", async () => {
    fake.signInAs(PATIENT_A_ID);

    const response = await requestPdf(
      [
        "periodo=7",
        `patientId=${PATIENT_B_ID}`,
        `patient_id=${PATIENT_B_ID}`,
        `id=${PATIENT_B_RECORD_1_ID}`,
        `recordId=${PATIENT_B_RECORD_2_ID}`,
      ].join("&")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("private, no-store");

    const data = renderedPdfData();
    expect(data.patientName).toBe(PATIENT_A_NAME);
    expect(data.recordCount).toBe(2);
    expect(data.pefSummary).toMatchObject({
      minimum: PATIENT_A_PEF_VALUES[0],
      maximum: PATIENT_A_PEF_VALUES[1],
      measurementCount: 2,
    });
    expect(data.attacksSummary).toMatchObject({ count: 1 });
    expect(data.chartPoints.map((point) => point.pefValue)).toEqual([
      PATIENT_A_PEF_VALUES[1],
      PATIENT_A_PEF_VALUES[0],
    ]);

    const serialized = JSON.stringify(data);
    for (const value of PATIENT_B_PEF_VALUES) {
      expect(hasNumber(serialized, value), `PEF ${value}`).toBe(false);
    }
    for (const note of PATIENT_B_NOTES) {
      expect(serialized).not.toContain(note);
    }
    expect(serialized).not.toContain(PATIENT_B_NAME);
    expect(serialized).not.toContain(PATIENT_B_ID);
    expect(serialized).not.toContain(PATIENT_B_RECORD_1_ID);
    // The PDF model never carries identifiers, not even the caller's own.
    expect(serialized).not.toContain(PATIENT_A_ID);
    expect(serialized).not.toContain(PATIENT_A_RECORD_1_ID);

    for (const query of fake.queriesOn("daily_records")) {
      expect(query.filters).toContainEqual({
        operator: "eq",
        column: "patient_id",
        value: PATIENT_A_ID,
      });
    }
    for (const query of fake.queriesOn("profiles")) {
      expect(query.filters).toContainEqual({
        operator: "eq",
        column: "id",
        value: PATIENT_A_ID,
      });
    }
  });

  test("o PDF do paciente B contém apenas os dados de B", async () => {
    fake.signInAs(PATIENT_B_ID);

    const response = await requestPdf(`periodo=7&patientId=${PATIENT_A_ID}`);

    expect(response.status).toBe(200);
    const data = renderedPdfData();
    expect(data.patientName).toBe(PATIENT_B_NAME);
    expect(data.attacksSummary).toMatchObject({ count: 2 });
    expect(JSON.stringify(data)).not.toContain(PATIENT_A_NAME);
    expect(
      data.chartPoints.some((point) =>
        (PATIENT_A_PEF_VALUES as readonly number[]).includes(point.pefValue)
      )
    ).toBe(false);
  });

  test("visitante anônimo recebe 401 vazio sem consultar registros", async () => {
    fake.signInAs(null);

    const response = await requestPdf(`periodo=7&patientId=${PATIENT_A_ID}`);

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).not.toBe("application/pdf");
    expect(await response.text()).toBe("");
    expect(fake.queriesOn("daily_records")).toHaveLength(0);
    expect(PatientReportPdfDocument).not.toHaveBeenCalled();
  });
});
