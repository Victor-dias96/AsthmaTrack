import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  getMedicalPatientReportHref,
  getMedicalPatientReportPath,
} from "./get-medical-patient-report-href";

const PATIENT_A = "8b6e6c1a-1b2c-4d3e-9f4a-5c6d7e8f9a0b";

describe("getMedicalPatientReportHref", () => {
  test("builds the medical report route without a query string", () => {
    assert.equal(
      getMedicalPatientReportPath(PATIENT_A),
      `/equipe-medica/pacientes/${PATIENT_A}/relatorio`
    );
  });

  test("preserves each established report period and only periodo", () => {
    assert.equal(
      getMedicalPatientReportHref(PATIENT_A, 7),
      `/equipe-medica/pacientes/${PATIENT_A}/relatorio?periodo=7`
    );
    assert.equal(
      getMedicalPatientReportHref(PATIENT_A, 30),
      `/equipe-medica/pacientes/${PATIENT_A}/relatorio?periodo=30`
    );
    assert.equal(
      getMedicalPatientReportHref(PATIENT_A, 90),
      `/equipe-medica/pacientes/${PATIENT_A}/relatorio?periodo=90`
    );
  });

  test("never points at the patient report or adds a health value", () => {
    const href = getMedicalPatientReportHref(PATIENT_A, 30);
    const url = new URL(href, "https://example.test");

    assert.deepEqual([...url.searchParams.keys()], ["periodo"]);
    assert.equal(url.pathname.includes("/paciente/"), false);
    assert.equal(url.pathname.endsWith("/relatorio"), true);
    assert.equal(href.includes("pef"), false);
    assert.equal(href.includes("nota"), false);
  });
});
