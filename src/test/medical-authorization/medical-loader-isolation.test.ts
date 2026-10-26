// @vitest-environment node

import { describe, expect, test } from "vitest";

import { getMedicalAuthorizedPatientDashboardData } from "@/features/medical-team/server/get-medical-authorized-patient-dashboard-data";
import { getMedicalAuthorizedPatientHistory } from "@/features/medical-team/server/get-medical-authorized-patient-history";
import { getMedicalAuthorizedPatientReportData } from "@/features/medical-team/server/get-medical-authorized-patient-report-data";
import { getMedicalAuthorizedPatients } from "@/features/medical-team/server/get-medical-authorized-patients";

/**
 * Fictional identities. These tests never open a network connection.
 * The stub returns only what a caller-scoped RPC would already have
 * filtered; it does not reimplement RLS.
 */
const PATIENT_A_ID = "11111111-1111-4111-8111-111111111111";
const PATIENT_B_ID = "22222222-2222-4222-8222-222222222222";
const PATIENT_A_NAME = "Paciente Fictício Alfa";
const PATIENT_B_NAME = "Paciente Fictício Beta";
const GRANTED_AT = "2026-01-15T12:00:00.000Z";
const RECORDED_AT = "2026-10-20T15:00:00.000Z";

type RpcCall = {
  name: string;
  args: Record<string, unknown> | null;
};

type RpcResponse = { data: unknown; error: { message: string } | null };

function listRow(patientId: string, patientName: string) {
  return {
    authorization_id: `${patientId.slice(0, 8)}-0000-4000-8000-000000000001`,
    patient_id: patientId,
    patient_full_name: patientName,
    granted_at: GRANTED_AT,
    latest_pef_value: 410,
    latest_recorded_at: RECORDED_AT,
  };
}

function latestRow(patientName: string) {
  return {
    patient_full_name: patientName,
    recorded_at: RECORDED_AT,
    pef_value: 410,
    cough_severity: 0,
    wheezing_severity: 0,
    shortness_of_breath_severity: 0,
    chest_tightness_severity: 0,
    had_attack: false,
    used_rescue_medication: false,
  };
}

function createRpcStub(responses: Record<string, unknown>) {
  const calls: RpcCall[] = [];
  const client = {
    async rpc(name: string, args?: Record<string, unknown>): Promise<RpcResponse> {
      calls.push({ name, args: args ?? null });

      if (!Object.hasOwn(responses, name)) {
        throw new Error(`Unexpected RPC ${name}`);
      }

      return { data: responses[name], error: null };
    },
  };

  return { calls, client: client as never };
}

function namesFromList(
  result: Awaited<ReturnType<typeof getMedicalAuthorizedPatients>>
) {
  return result.status === "ready"
    ? result.patients.map((patient) => patient.patientName)
    : [];
}

describe("medical authorized-patient loaders", () => {
  test("medical A list contains only the patient the RPC returned", async () => {
    const { calls, client } = createRpcStub({
      get_medical_authorized_patients: [listRow(PATIENT_A_ID, PATIENT_A_NAME)],
    });

    const result = await getMedicalAuthorizedPatients(client);

    expect(namesFromList(result)).toEqual([PATIENT_A_NAME]);
    expect(calls).toEqual([
      { name: "get_medical_authorized_patients", args: null },
    ]);
  });

  test("medical B list contains only the patient the RPC returned", async () => {
    const { client } = createRpcStub({
      get_medical_authorized_patients: [listRow(PATIENT_B_ID, PATIENT_B_NAME)],
    });

    const result = await getMedicalAuthorizedPatients(client);

    expect(namesFromList(result)).toEqual([PATIENT_B_NAME]);
  });

  test("search cannot discover a patient absent from the RPC result", async () => {
    const { calls, client } = createRpcStub({
      get_medical_authorized_patients: [listRow(PATIENT_A_ID, PATIENT_A_NAME)],
    });

    const missed = await getMedicalAuthorizedPatients(client, PATIENT_B_NAME);
    const wildcard = await getMedicalAuthorizedPatients(client, "%");
    const found = await getMedicalAuthorizedPatients(client, "Alfa");

    expect(missed.status).toBe("no-results");
    expect(wildcard.status).toBe("no-results");
    expect(namesFromList(found)).toEqual([PATIENT_A_NAME]);
    expect(calls).toHaveLength(3);
    expect(calls.every((call) => call.args === null)).toBe(true);
    expect(calls.every((call) => call.name === "get_medical_authorized_patients")).toBe(
      true
    );
  });

  test("dashboard, history and report loaders return nothing when the latest RPC is empty", async () => {
    const dashboardStub = createRpcStub({
      get_medical_authorized_patient_latest_records: [],
      get_medical_authorized_patient_period_records: [latestRow(PATIENT_B_NAME)],
    });
    const dashboard = await getMedicalAuthorizedPatientDashboardData(
      dashboardStub.client,
      PATIENT_B_ID,
      30
    );

    expect(dashboard.status).toBe("inaccessible");
    expect(dashboardStub.calls.map((call) => call.name)).toEqual([
      "get_medical_authorized_patient_latest_records",
    ]);
    expect(dashboardStub.calls[0]?.args).toEqual({ p_patient_id: PATIENT_B_ID });

    const historyStub = createRpcStub({
      get_medical_authorized_patient_latest_records: [],
      get_medical_authorized_patient_period_records: [latestRow(PATIENT_B_NAME)],
    });
    const history = await getMedicalAuthorizedPatientHistory(
      historyStub.client,
      PATIENT_B_ID,
      30,
      1
    );

    expect(history.status).toBe("inaccessible");
    expect(historyStub.calls.map((call) => call.name)).toEqual([
      "get_medical_authorized_patient_latest_records",
    ]);
    expect(historyStub.calls[0]?.args).toEqual({ p_patient_id: PATIENT_B_ID });

    const reportStub = createRpcStub({
      get_medical_authorized_patient_latest_records: [],
      get_medical_authorized_patient_period_records: [latestRow(PATIENT_B_NAME)],
    });
    const report = await getMedicalAuthorizedPatientReportData(
      reportStub.client,
      PATIENT_B_ID,
      30,
      new Date("2026-10-26T15:00:00.000Z")
    );

    expect(report.status).toBe("inaccessible");
    expect(reportStub.calls.map((call) => call.name)).toEqual([
      "get_medical_authorized_patient_latest_records",
    ]);
    expect(JSON.stringify(report)).not.toContain(PATIENT_B_NAME);
  });

  test("an authorized dashboard reads only the requested patient through the two read RPCs", async () => {
    const { calls, client } = createRpcStub({
      get_medical_authorized_patient_latest_records: [latestRow(PATIENT_A_NAME)],
      get_medical_authorized_patient_period_records: [latestRow(PATIENT_A_NAME)],
    });

    const result = await getMedicalAuthorizedPatientDashboardData(
      client,
      PATIENT_A_ID,
      7
    );

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.data.patientName).toBe(PATIENT_A_NAME);
    }

    expect(calls.map((call) => call.name)).toEqual([
      "get_medical_authorized_patient_latest_records",
      "get_medical_authorized_patient_period_records",
    ]);

    for (const call of calls) {
      expect(call.args).not.toHaveProperty("professional_id");
      expect(call.args?.p_patient_id).toBe(PATIENT_A_ID);
    }
  });

  test("a revoked authorization is an empty RPC result and yields no patient data", async () => {
    const listStub = createRpcStub({ get_medical_authorized_patients: [] });
    const list = await getMedicalAuthorizedPatients(listStub.client);
    expect(list.status).toBe("empty");

    const historyStub = createRpcStub({
      get_medical_authorized_patient_latest_records: [],
    });
    const history = await getMedicalAuthorizedPatientHistory(
      historyStub.client,
      PATIENT_A_ID,
      90,
      1
    );

    expect(history.status).toBe("inaccessible");
    expect(JSON.stringify(history)).not.toContain(PATIENT_A_NAME);
  });
});
