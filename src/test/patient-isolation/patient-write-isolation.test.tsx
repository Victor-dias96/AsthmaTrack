import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { DailyRecordEditForm } from "@/features/daily-records/components/daily-record-edit-form";
import {
  DAILY_RECORD_DELETE_NOT_FOUND_ERROR_MESSAGE,
  DAILY_RECORD_UPDATE_SUCCESS_MESSAGE,
} from "@/features/daily-records/lib/classify-daily-record-submit-error";
import {
  buildDailyRecordInsertPayload,
  buildDailyRecordUpdatePayload,
} from "@/features/daily-records/lib/daily-record-payload";
import type { DailyRecordEditFormInitialValues } from "@/features/daily-records/lib/map-daily-record-to-edit-form-values";
import { DailyRecordDeleteAction } from "@/features/history";
import { dailyRecordFormSchema } from "@/schemas/daily-record";

import {
  PATIENT_A_ID,
  PATIENT_A_RECORD_1_ID,
  PATIENT_A_RECORD_2_ID,
  PATIENT_B_ID,
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
  router: { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => state.fake,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => state.router,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const HISTORY_HREF = "/paciente/historico";

/** Fictional, past and schema-valid edit values. */
const EDIT_VALUES: DailyRecordEditFormInitialValues = {
  recordedAt: "2025-03-10T08:00",
  pefValue: 999,
  coughSeverity: 0,
  wheezingSeverity: 0,
  shortnessOfBreathSeverity: 0,
  chestTightnessSeverity: 0,
  hadAttack: false,
  usedRescueMedication: false,
  notes: "Nota fictícia de tentativa de alteração",
};

const OWNERSHIP_KEYS = ["id", "patient_id", "patientId", "professional_id", "role"];

let fake: UnrestrictedSupabaseFake;

function recordRow(id: string) {
  return fake.snapshot("daily_records").find((row) => row.id === id);
}

function otherPatientRows(patientId: string) {
  return fake
    .snapshot("daily_records")
    .filter((row) => row.patient_id !== patientId);
}

async function confirmDelete(recordId: string) {
  const user = userEvent.setup();
  render(<DailyRecordDeleteAction recordId={recordId} historyHref={HISTORY_HREF} />);

  await user.click(screen.getByRole("button", { name: "Excluir registro" }));
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Excluir registro" }));

  return dialog;
}

async function submitEdit(recordId: string) {
  const user = userEvent.setup();
  render(
    <DailyRecordEditForm
      recordId={recordId}
      detailsHref={`${HISTORY_HREF}/${recordId}`}
      initialValues={EDIT_VALUES}
    />
  );

  await user.click(screen.getByRole("button", { name: "Salvar registro" }));
}

beforeEach(() => {
  state.router.replace.mockReset();
  state.router.refresh.mockReset();
  fake = new UnrestrictedSupabaseFake({
    daily_records: buildDailyRecordFixtures(new Date()),
    profiles: buildProfileFixtures(),
  });
  state.fake = asSupabaseClient(fake);
});

describe("isolamento entre pacientes: escrita pela aplicação", () => {
  test("paciente A não exclui o registro do paciente B", async () => {
    fake.signInAs(PATIENT_A_ID);
    const before = recordRow(PATIENT_B_RECORD_1_ID);

    const dialog = await confirmDelete(PATIENT_B_RECORD_1_ID);

    expect(
      await within(dialog).findByText(DAILY_RECORD_DELETE_NOT_FOUND_ERROR_MESSAGE)
    ).toBeVisible();
    expect(recordRow(PATIENT_B_RECORD_1_ID)).toEqual(before);
    expect(state.router.replace).not.toHaveBeenCalled();
    expect(fake.queriesOn("daily_records")).toEqual([
      expect.objectContaining({
        operation: "delete",
        filters: expect.arrayContaining([
          { operator: "eq", column: "patient_id", value: PATIENT_A_ID },
        ]),
      }),
    ]);
  });

  test("paciente A não altera o registro do paciente B", async () => {
    fake.signInAs(PATIENT_A_ID);
    const before = recordRow(PATIENT_B_RECORD_2_ID);

    await submitEdit(PATIENT_B_RECORD_2_ID);

    expect(
      await screen.findByRole("heading", { name: "Registro não encontrado" })
    ).toBeVisible();
    expect(screen.queryByText(DAILY_RECORD_UPDATE_SUCCESS_MESSAGE)).toBeNull();
    expect(recordRow(PATIENT_B_RECORD_2_ID)).toEqual(before);
    expect(fake.queriesOn("daily_records")[0].filters).toContainEqual({
      operator: "eq",
      column: "patient_id",
      value: PATIENT_A_ID,
    });
  });

  describe.each([
    { label: "A", patientId: PATIENT_A_ID, editId: PATIENT_A_RECORD_1_ID, deleteId: PATIENT_A_RECORD_2_ID },
    { label: "B", patientId: PATIENT_B_ID, editId: PATIENT_B_RECORD_1_ID, deleteId: PATIENT_B_RECORD_2_ID },
  ])("paciente $label gerencia os próprios registros", ({ patientId, editId, deleteId }) => {
    test("altera o próprio registro sem tocar no outro paciente", async () => {
      fake.signInAs(patientId);
      const othersBefore = otherPatientRows(patientId);

      await submitEdit(editId);

      expect(await screen.findByText(DAILY_RECORD_UPDATE_SUCCESS_MESSAGE)).toBeVisible();
      expect(recordRow(editId)).toMatchObject({
        patient_id: patientId,
        pef_value: EDIT_VALUES.pefValue,
      });
      expect(otherPatientRows(patientId)).toEqual(othersBefore);

      // The update payload can never move a record to another owner.
      const [update] = fake.queriesOn("daily_records");
      for (const key of OWNERSHIP_KEYS) {
        expect(update.payload).not.toHaveProperty(key);
      }
    });

    test("exclui o próprio registro sem tocar no outro paciente", async () => {
      fake.signInAs(patientId);
      const othersBefore = otherPatientRows(patientId);

      await confirmDelete(deleteId);

      await vi.waitFor(() => {
        expect(state.router.replace).toHaveBeenCalledWith(HISTORY_HREF);
      });
      expect(recordRow(deleteId)).toBeUndefined();
      expect(otherPatientRows(patientId)).toEqual(othersBefore);
    });
  });
});

describe("isolamento entre pacientes: campos de propriedade forjados", () => {
  const forgedFormValues = {
    recordedAt: "2025-03-10T08:00",
    pefValue: "321",
    coughSeverity: 0,
    wheezingSeverity: 0,
    shortnessOfBreathSeverity: 0,
    chestTightnessSeverity: 0,
    hadAttack: false,
    usedRescueMedication: false,
    notes: "",
    id: PATIENT_B_RECORD_1_ID,
    patient_id: PATIENT_B_ID,
    patientId: PATIENT_B_ID,
    professional_id: PATIENT_B_ID,
    role: "medical",
  };

  test("o schema descarta campos de propriedade enviados pelo navegador", () => {
    const result = dailyRecordFormSchema.safeParse(forgedFormValues);

    expect(result.success).toBe(true);
    if (!result.success) return;
    for (const key of OWNERSHIP_KEYS) {
      expect(result.data).not.toHaveProperty(key);
    }
  });

  test("a inserção usa apenas o paciente verificado como dono", () => {
    const result = dailyRecordFormSchema.safeParse(forgedFormValues);
    if (!result.success) throw new Error("schema rejeitou valores válidos");

    const payload = buildDailyRecordInsertPayload(
      result.data,
      "2025-03-10T11:00:00.000Z",
      PATIENT_A_ID
    );

    expect(payload.patient_id).toBe(PATIENT_A_ID);
    expect(Object.keys(payload).sort()).toEqual(
      [
        "chest_tightness_severity",
        "cough_severity",
        "had_attack",
        "notes",
        "patient_id",
        "pef_value",
        "recorded_at",
        "shortness_of_breath_severity",
        "used_rescue_medication",
        "wheezing_severity",
      ].sort()
    );
  });

  test("a atualização nunca inclui colunas de propriedade", () => {
    const result = dailyRecordFormSchema.safeParse(forgedFormValues);
    if (!result.success) throw new Error("schema rejeitou valores válidos");

    const payload = buildDailyRecordUpdatePayload(
      result.data,
      "2025-03-10T11:00:00.000Z"
    );

    for (const key of OWNERSHIP_KEYS) {
      expect(payload).not.toHaveProperty(key);
    }
  });
});
