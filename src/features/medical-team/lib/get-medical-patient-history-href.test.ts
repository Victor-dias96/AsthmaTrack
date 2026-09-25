import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  getMedicalPatientDashboardPath,
  getMedicalPatientHistoryHref,
  getMedicalPatientHistoryPath,
} from "./get-medical-patient-history-href";

const PATIENT_ID = "8b6e6c1a-1b2c-4d3e-9f4a-5c6d7e8f9a0b";

describe("getMedicalPatientHistoryHref", () => {
  test("builds the history route and omits page 1", () => {
    assert.equal(
      getMedicalPatientHistoryPath(PATIENT_ID),
      `/equipe-medica/pacientes/${PATIENT_ID}/historico`
    );
    assert.equal(
      getMedicalPatientHistoryHref(PATIENT_ID, 7),
      `/equipe-medica/pacientes/${PATIENT_ID}/historico?periodo=7`
    );
  });

  test("preserves a later page and every established period", () => {
    assert.equal(
      getMedicalPatientHistoryHref(PATIENT_ID, 30, 2),
      `/equipe-medica/pacientes/${PATIENT_ID}/historico?periodo=30&pagina=2`
    );
    assert.equal(
      getMedicalPatientHistoryHref(PATIENT_ID, 90, 3),
      `/equipe-medica/pacientes/${PATIENT_ID}/historico?periodo=90&pagina=3`
    );
  });

  test("dashboard return path has no query string", () => {
    assert.equal(
      getMedicalPatientDashboardPath(PATIENT_ID),
      `/equipe-medica/pacientes/${PATIENT_ID}`
    );
  });

  test("never adds a health value or a second identity", () => {
    const href = getMedicalPatientHistoryHref(PATIENT_ID, 7, 2);
    const url = new URL(href, "https://example.test");

    assert.deepEqual([...url.searchParams.keys()], ["periodo", "pagina"]);
    assert.equal(url.pathname.includes("historico"), true);
    assert.equal(url.pathname.includes("/paciente/"), false);
  });
});
