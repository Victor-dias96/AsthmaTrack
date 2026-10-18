import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import DashboardPage from "@/app/paciente/dashboard/page";
import DailyRecordDetailsPage from "@/app/paciente/historico/[id]/page";
import EditDailyRecordPage from "@/app/paciente/historico/[id]/editar/page";
import HistoricoPage from "@/app/paciente/historico/page";
import RelatorioPage from "@/app/paciente/relatorio/page";
import { loadPatientDashboardData } from "@/features/dashboard";
import { getHistoryPeriodRange, loadPatientDailyRecord, loadPatientHistory } from "@/features/history";
import {
  calculatePefSummary,
  calculateRecordedAttacksSummary,
  getPatientReportData,
} from "@/features/reports";

import {
  NONEXISTENT_RECORD_ID,
  PATIENT_A_ID,
  PATIENT_A_NAME,
  PATIENT_A_NOTES,
  PATIENT_A_PEF_VALUES,
  PATIENT_A_RECORD_1_ID,
  PATIENT_A_RECORD_2_ID,
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

class NotFoundSignal extends Error {}

class RedirectSignal extends Error {
  constructor(readonly location: string) {
    super(`redirect:${location}`);
  }
}

const state = vi.hoisted(() => ({
  fake: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.fake,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => state.fake,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundSignal("not-found");
  },
  redirect: (location: string) => {
    throw new RedirectSignal(location);
  },
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/paciente",
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Navigation chrome only; it renders no patient data.
vi.mock("@/components/layout/patient-shell", () => ({
  PatientShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const NOW = new Date();

const SAME_WINDOW_RANGE = getHistoryPeriodRange(7, NOW);

/**
 * Query parameters an attacker might add to any patient URL. None of them
 * is read as ownership by any patient route.
 */
const FORGED_IDENTITY_PARAMS = {
  patientId: PATIENT_B_ID,
  patient_id: PATIENT_B_ID,
  paciente: PATIENT_B_ID,
  userId: PATIENT_B_ID,
};

type Patient = {
  label: string;
  id: string;
  name: string;
  recordIds: [string, string];
  pefValues: readonly number[];
  notes: string[];
};

const PATIENT_A: Patient = {
  label: "A",
  id: PATIENT_A_ID,
  name: PATIENT_A_NAME,
  recordIds: [PATIENT_A_RECORD_1_ID, PATIENT_A_RECORD_2_ID],
  pefValues: PATIENT_A_PEF_VALUES,
  notes: PATIENT_A_NOTES,
};

const PATIENT_B: Patient = {
  label: "B",
  id: PATIENT_B_ID,
  name: PATIENT_B_NAME,
  recordIds: [PATIENT_B_RECORD_1_ID, PATIENT_B_RECORD_2_ID],
  pefValues: PATIENT_B_PEF_VALUES,
  notes: PATIENT_B_NOTES,
};

const PAIRS = [
  { actor: PATIENT_A, other: PATIENT_B },
  { actor: PATIENT_B, other: PATIENT_A },
] as const;

let fake: UnrestrictedSupabaseFake;

function signInAs(patientId: string | null) {
  fake.signInAs(patientId);
}

function routeParams(id: string) {
  return Promise.resolve({ id });
}

function search(params: Record<string, string> = {}) {
  return Promise.resolve(params);
}

function hasNumber(text: string, value: number): boolean {
  return new RegExp(`(^|\\D)${value}(\\D|$)`).test(text);
}

function renderedHrefs(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("a")).map(
    (anchor) => anchor.getAttribute("href") ?? ""
  );
}

/**
 * Every daily_records read the application issued for this request must be
 * scoped to the signed-in patient by the application itself.
 */
function expectEveryRecordQueryScopedTo(patientId: string) {
  const reads = fake.queriesOn("daily_records");

  expect(reads.length).toBeGreaterThan(0);

  for (const query of reads) {
    expect(query.filters).toContainEqual({
      operator: "eq",
      column: "patient_id",
      value: patientId,
    });
  }
}

function expectNoTraceOf(container: HTMLElement, other: Patient) {
  const text = container.textContent ?? "";

  for (const value of other.pefValues) {
    expect(hasNumber(text, value), `PEF ${value}`).toBe(false);
  }

  for (const note of other.notes) {
    expect(text).not.toContain(note);
  }

  expect(text).not.toContain(other.name);
  expect(text).not.toContain(other.id);

  for (const recordId of other.recordIds) {
    expect(text).not.toContain(recordId);
    expect(renderedHrefs(container).join(" ")).not.toContain(recordId);
  }
}

async function expectNotFound(page: Promise<unknown>) {
  await expect(page).rejects.toBeInstanceOf(NotFoundSignal);
}

beforeEach(() => {
  // jsdom has no matchMedia; the report chart subscribes to print media.
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );

  fake = new UnrestrictedSupabaseFake({
    daily_records: buildDailyRecordFixtures(NOW),
    profiles: buildProfileFixtures(),
  });
  state.fake = asSupabaseClient(fake);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isolamento entre pacientes: leitura", () => {
  describe.each(PAIRS)("paciente $actor.label", ({ actor, other }) => {
    test("o dashboard mostra apenas os próprios registros", async () => {
      signInAs(actor.id);

      const { container } = render(
        await DashboardPage({ searchParams: search(FORGED_IDENTITY_PARAMS) })
      );

      const text = container.textContent ?? "";
      expect(hasNumber(text, actor.pefValues[0])).toBe(true);
      expectNoTraceOf(container, other);
      expectEveryRecordQueryScopedTo(actor.id);
    });

    test("o histórico mostra apenas os próprios registros", async () => {
      signInAs(actor.id);

      const { container } = render(
        await HistoricoPage({
          searchParams: search({ ...FORGED_IDENTITY_PARAMS, periodo: "7" }),
        })
      );

      const hrefs = renderedHrefs(container).join(" ");
      for (const recordId of actor.recordIds) {
        expect(hrefs).toContain(recordId);
      }
      for (const value of actor.pefValues) {
        expect(hasNumber(container.textContent ?? "", value), `PEF ${value}`).toBe(true);
      }
      expectNoTraceOf(container, other);
      expectEveryRecordQueryScopedTo(actor.id);
    });

    test("abre o detalhe do próprio registro", async () => {
      signInAs(actor.id);

      const { container } = render(
        await DailyRecordDetailsPage({
          params: routeParams(actor.recordIds[0]),
          searchParams: search(),
        })
      );

      expect(hasNumber(container.textContent ?? "", actor.pefValues[0])).toBe(true);
      expect(container.textContent).toContain(actor.notes[0]);
      expectNoTraceOf(container, other);
    });

    test("não abre o detalhe do registro do outro paciente", async () => {
      signInAs(actor.id);

      await expectNotFound(
        DailyRecordDetailsPage({
          params: routeParams(other.recordIds[0]),
          searchParams: search(FORGED_IDENTITY_PARAMS),
        })
      );

      // The other patient's row is never selected, not fetched-then-hidden.
      expectEveryRecordQueryScopedTo(actor.id);
    });

    test("não abre a edição do registro do outro paciente", async () => {
      signInAs(actor.id);

      await expectNotFound(
        EditDailyRecordPage({ params: routeParams(other.recordIds[1]) })
      );

      expectEveryRecordQueryScopedTo(actor.id);
    });

    test("abre a edição do próprio registro", async () => {
      signInAs(actor.id);

      const { container } = render(
        await EditDailyRecordPage({ params: routeParams(actor.recordIds[1]) })
      );

      expect(
        screen.getByRole("heading", { name: "Editar registro" })
      ).toBeVisible();
      expect(screen.getByDisplayValue(String(actor.pefValues[1]))).toBeVisible();
      expectNoTraceOf(container, other);
    });

    test("o relatório mostra apenas os próprios registros", async () => {
      signInAs(actor.id);

      const { container } = render(
        await RelatorioPage({
          searchParams: search({ ...FORGED_IDENTITY_PARAMS, periodo: "7" }),
        })
      );

      const text = container.textContent ?? "";
      expect(text).toContain(actor.name);
      for (const value of actor.pefValues) {
        expect(hasNumber(text, value), `PEF ${value}`).toBe(true);
      }
      expectNoTraceOf(container, other);
      expectEveryRecordQueryScopedTo(actor.id);
    });
  });

  test("registro de outro paciente e registro inexistente têm o mesmo resultado", async () => {
    signInAs(PATIENT_A_ID);

    const foreign = await loadPatientDailyRecord(PATIENT_B_RECORD_1_ID);
    const missing = await loadPatientDailyRecord(NONEXISTENT_RECORD_ID);

    expect(foreign).toEqual({ status: "not-found" });
    expect(missing).toEqual(foreign);

    await expectNotFound(
      DailyRecordDetailsPage({
        params: routeParams(NONEXISTENT_RECORD_ID),
        searchParams: search(),
      })
    );
  });

  test("ID de registro malformado é rejeitado antes de qualquer consulta", async () => {
    signInAs(PATIENT_A_ID);

    await expectNotFound(
      DailyRecordDetailsPage({
        params: routeParams(`${PATIENT_B_RECORD_1_ID}' or '1'='1`),
        searchParams: search(),
      })
    );

    expect(fake.queriesOn("daily_records")).toHaveLength(0);
  });
});

describe("isolamento entre pacientes: agregações", () => {
  test("métricas do dashboard de A ignoram os registros de B", async () => {
    const result = await loadPatientDashboardData(
      asSupabaseClient(fake),
      PATIENT_A_ID,
      7
    );

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    // Patient B's record is the newest overall; A's latest must still be A's.
    expect(result.data.latestPef).toBe(PATIENT_A_PEF_VALUES[0]);
    expect(result.data.totalRecords).toBe(2);
    expect(result.data.recordedAttacks).toBe(1);
    expect(result.data.rescueMedicationUsage).toBe(1);
    expect(result.data.daysWithSymptoms).toBe(1);
    expect(result.data.pefChartPoints.map((point) => point.pefValue)).toEqual([
      PATIENT_A_PEF_VALUES[1],
      PATIENT_A_PEF_VALUES[0],
    ]);
    expect(result.data.recentRecords.map((record) => record.patientId)).toEqual([
      PATIENT_A_ID,
      PATIENT_A_ID,
    ]);
  });

  test("métricas do dashboard de B ignoram os registros de A", async () => {
    const result = await loadPatientDashboardData(
      asSupabaseClient(fake),
      PATIENT_B_ID,
      7
    );

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.data.latestPef).toBe(PATIENT_B_PEF_VALUES[0]);
    expect(result.data.totalRecords).toBe(2);
    expect(result.data.recordedAttacks).toBe(2);
    expect(result.data.rescueMedicationUsage).toBe(2);
    expect(result.data.daysWithSymptoms).toBe(2);
    expect(result.data.pefChartPoints.map((point) => point.pefValue)).toEqual([
      PATIENT_B_PEF_VALUES[1],
      PATIENT_B_PEF_VALUES[0],
    ]);
  });

  test("resumos do relatório de A não são influenciados por B", async () => {
    const result = await getPatientReportData(
      asSupabaseClient(fake),
      PATIENT_A_ID,
      7,
      NOW
    );

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.data.recordCount).toBe(2);
    expect(calculatePefSummary(result.data.records)).toEqual({
      latest: PATIENT_A_PEF_VALUES[0],
      average: (PATIENT_A_PEF_VALUES[0] + PATIENT_A_PEF_VALUES[1]) / 2,
      minimum: PATIENT_A_PEF_VALUES[0],
      maximum: PATIENT_A_PEF_VALUES[1],
      measurementCount: 2,
    });
    expect(calculateRecordedAttacksSummary(result.data.records)).toMatchObject({
      count: 1,
    });
  });

  test("histórico paginado conta apenas os registros do paciente", async () => {
    signInAs(PATIENT_A_ID);

    const result = await loadPatientHistory(SAME_WINDOW_RANGE, 1);

    expect(result).toMatchObject({ status: "ok", totalCount: 2, totalPages: 1 });
    if (result.status !== "ok") return;
    expect(result.records.map((record) => record.id)).toEqual([
      PATIENT_A_RECORD_1_ID,
      PATIENT_A_RECORD_2_ID,
    ]);

    // A page past the patient's own data never spills into another patient.
    const secondPage = await loadPatientHistory(SAME_WINDOW_RANGE, 2);
    expect(secondPage).toMatchObject({ status: "ok", records: [], totalCount: 2 });
  });
});

describe("isolamento entre pacientes: visitante anônimo", () => {
  test.each([
    ["dashboard", () => DashboardPage({ searchParams: search() })],
    ["histórico", () => HistoricoPage({ searchParams: search() })],
    [
      "detalhe",
      () =>
        DailyRecordDetailsPage({
          params: routeParams(PATIENT_A_RECORD_1_ID),
          searchParams: search(),
        }),
    ],
    ["edição", () => EditDailyRecordPage({ params: routeParams(PATIENT_A_RECORD_1_ID) })],
    ["relatório", () => RelatorioPage({ searchParams: search() })],
  ])("%s redireciona para o login sem consultar registros", async (_, page) => {
    signInAs(null);

    const outcome = page();

    await expect(outcome).rejects.toBeInstanceOf(RedirectSignal);
    await expect(outcome).rejects.toMatchObject({ location: "/login" });
    expect(fake.queriesOn("daily_records")).toHaveLength(0);
  });
});
