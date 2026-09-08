import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getMedicalPatientDashboardPeriodHref } from "./get-medical-patient-dashboard-period-href";

const PATIENT_ID = "8b6e6c1a-1b2c-4d3e-9f4a-5c6d7e8f9a0b";

describe("getMedicalPatientDashboardPeriodHref", () => {
  test("builds the current authorized patient's own dynamic route", () => {
    assert.equal(
      getMedicalPatientDashboardPeriodHref(PATIENT_ID, 7),
      `/equipe-medica/pacientes/${PATIENT_ID}?periodo=7`
    );
  });

  test("supports every established period", () => {
    assert.equal(
      getMedicalPatientDashboardPeriodHref(PATIENT_ID, 30),
      `/equipe-medica/pacientes/${PATIENT_ID}?periodo=30`
    );
    assert.equal(
      getMedicalPatientDashboardPeriodHref(PATIENT_ID, 90),
      `/equipe-medica/pacientes/${PATIENT_ID}?periodo=90`
    );
  });

  test("never adds a second search parameter", () => {
    const href = getMedicalPatientDashboardPeriodHref(PATIENT_ID, 7);
    const url = new URL(href, "https://example.test");

    assert.deepEqual([...url.searchParams.keys()], ["periodo"]);
  });
});
