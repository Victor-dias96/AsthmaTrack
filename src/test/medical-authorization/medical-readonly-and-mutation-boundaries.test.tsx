import { readFileSync, readdirSync } from "node:fs";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as typeof ResizeObserver;
import { join } from "node:path";
import type { ReactNode } from "react";
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AUTHORIZATION_REVOKE_NO_ROW_MESSAGE } from "@/features/access-authorizations/lib/classify-authorization-revoke-error";
import { AuthorizedPatientList } from "@/features/medical-team/components/authorized-patient-list";
import { AuthorizedPatientSearch } from "@/features/medical-team/components/authorized-patient-search";
import { MedicalPatientDashboardPageContent } from "@/features/medical-team/components/medical-patient-dashboard-page-content";
import { MedicalPatientHistoryPageContent } from "@/features/medical-team/components/medical-patient-history-page-content";
import { MedicalPatientReportPageContent } from "@/features/medical-team/components/medical-patient-report-page-content";

const PATIENT_ID = "11111111-1111-4111-8111-111111111111";
const MEDICAL_ID = "33333333-3333-4333-8333-333333333333";
const PROFESSIONAL_ID = "44444444-4444-4444-8444-444444444444";
const AUTHORIZATION_ID = "c1111111-0000-4000-8000-0000000000c1";
const RECORDED_AT = "2026-10-20T15:00:00.000Z";

const WRITE_LABELS = [
  "Novo registro",
  "Editar",
  "Excluir",
  "Salvar alterações",
  "Registrar crise",
  "Alterar PEF",
  "Adicionar observação",
  "Revogar acesso",
  "Reativar acesso",
];

type Filter = { operator: "eq" | "is"; column: string; value: unknown };

const state = vi.hoisted(() => ({
  userId: "11111111-1111-4111-8111-111111111111",
  inserts: [] as Record<string, unknown>[],
  updates: [] as { payload: Record<string, unknown>; filters: Filter[] }[],
  rows: [] as { id: string; patient_id: string; revoked_at: string | null }[],
}));

vi.mock("@/features/medical-team/components/medical-patient-dashboard-pef-chart", () => ({
  MedicalPatientDashboardPefChart: () => null,
}));

vi.mock("@/features/reports/components/report-pef-chart", () => ({
  ReportPefChart: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: async () => ({
      data: [{ id: PROFESSIONAL_ID, full_name: "Profissional Fictício Alfa" }],
      error: null,
      status: 200,
    }),
    auth: {
      getUser: async () => ({
        data: { user: { id: state.userId } },
        error: null,
      }),
    },
    from: (table: string) => {
      if (table !== "patient_access_authorizations") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        insert: (payload: Record<string, unknown>) => {
          state.inserts.push(payload);
          return Promise.resolve({ error: null, status: 201 });
        },
        update: (payload: Record<string, unknown>) => {
          const filters: Filter[] = [];
          const chain = {
            eq(column: string, value: unknown) {
              filters.push({ operator: "eq", column, value });
              return chain;
            },
            is(column: string, value: unknown) {
              filters.push({ operator: "is", column, value });
              return chain;
            },
            select() {
              return chain;
            },
            maybeSingle() {
              state.updates.push({ payload, filters: [...filters] });
              const id = filters.find((filter) => filter.column === "id")?.value;
              const patientId = filters.find(
                (filter) => filter.column === "patient_id"
              )?.value;
              const row = state.rows.find(
                (candidate) =>
                  candidate.id === id &&
                  candidate.patient_id === patientId &&
                  candidate.revoked_at === null
              );

              if (row && payload.revoked_at) {
                row.revoked_at = String(payload.revoked_at);
              }

              return Promise.resolve({
                data: row ? { id: row.id } : null,
                error: null,
                status: 200,
              });
            },
          };

          return chain;
        },
      };
    },
  }),
}));

function readRepo(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function listSourceFiles(relativeDir: string): string[] {
  const absoluteDir = join(process.cwd(), relativeDir);
  const found: string[] = [];

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativeEntry = `${relativeDir}/${entry.name}`;

    if (entry.isDirectory()) {
      found.push(...listSourceFiles(relativeEntry));
      continue;
    }

    if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
      found.push(relativeEntry);
    }
  }

  return found;
}

const record = {
  recordedAt: RECORDED_AT,
  pefValue: 410,
  coughSeverity: 0,
  wheezingSeverity: 0,
  shortnessOfBreathSeverity: 0,
  chestTightnessSeverity: 0,
  hadAttack: false,
  usedRescueMedication: false,
} as const;

function expectReadOnly(container: HTMLElement) {
  const text = container.textContent ?? "";

  for (const label of WRITE_LABELS) {
    expect(text).not.toContain(label);
  }

  expect(text).toContain("Somente leitura");
  expect(container.querySelector("textarea")).toBeNull();
  expect(container.querySelector("[contenteditable='true']")).toBeNull();
  expect(container.querySelector("form[method='post']")).toBeNull();
  expect(container.querySelector("input:not([type='search'])")).toBeNull();
}

describe("medical pages stay read-only", () => {
  test("list, dashboard, history and report expose no write control", () => {
    const list = render(
      <div>
        <AuthorizedPatientSearch searchTerm="" />
        <AuthorizedPatientList
          patients={[
            {
              authorizationId: AUTHORIZATION_ID,
              patientId: PATIENT_ID,
              patientName: "Paciente Fictício Alfa",
              authorizedAt: "2026-01-15T12:00:00.000Z",
              latestRecord: {
                kind: "ready",
                pefValue: 410,
                recordedAt: RECORDED_AT,
              },
            },
          ]}
        />
      </div>
    );

    expectReadOnly(list.container);
    expect(list.container.querySelector("form")?.getAttribute("method")).toBe("get");
    expect(list.container.querySelectorAll("input")).toHaveLength(1);
    list.unmount();

    const dashboard = render(
      <MedicalPatientDashboardPageContent
        patientId={PATIENT_ID}
        currentPeriod={7}
        result={{
          status: "ready",
          data: {
            patientName: "Paciente Fictício Alfa",
            latestPef: 410,
            latestRecordedAt: RECORDED_AT,
            totalRecords: 1,
            daysWithSymptoms: 0,
            recordedAttacks: 0,
            rescueMedicationUsage: 0,
            pefChartPoints: [{ recordedAt: RECORDED_AT, pefValue: 410 }],
            recentRecords: [record],
          },
        }}
      />
    );
    expectReadOnly(dashboard.container);
    dashboard.unmount();

    const history = render(
      <MedicalPatientHistoryPageContent
        patientId={PATIENT_ID}
        currentPeriod={30}
        currentPage={1}
        result={{
          status: "ready",
          patientName: "Paciente Fictício Alfa",
          records: [record],
          totalCount: 1,
          totalPages: 1,
        }}
      />
    );
    expectReadOnly(history.container);
    history.unmount();

    const report = render(
      <MedicalPatientReportPageContent
        patientId={PATIENT_ID}
        currentPeriod={30}
        result={{
          status: "ready",
          data: {
            patientName: "Paciente Fictício Alfa",
            period: 30,
            displayStart: { year: 2026, month: 9, day: 27 },
            displayEnd: { year: 2026, month: 10, day: 26 },
            generatedAtIso: "2026-10-26T15:00:00.000Z",
            generatedAtLabel: "26/10/2026",
            recordCount: 1,
            pefSummary: {
              latest: 410,
              average: 410,
              minimum: 410,
              maximum: 410,
              measurementCount: 1,
            },
            symptomSummary: { totalRecords: 1, items: [] },
            attacksSummary: { count: 0, attacks: [] },
            chartPoints: [{ recordedAt: RECORDED_AT, pefValue: 410 }],
          },
        }}
      />
    );
    expectReadOnly(report.container);
  });

  test("private medical documents are dynamic and outside the service worker cache", () => {
    const worker = readRepo("public/sw.js");
    const navigation = worker.slice(
      worker.indexOf("async function respondToNavigation"),
      worker.indexOf("async function respondToStatic")
    );

    expect(worker).toContain('pathname === "/equipe-medica"');
    expect(worker).toContain('pathname.startsWith("/equipe-medica/")');
    expect(navigation).not.toContain("cache.put");

    const dynamicPages = [
      "src/app/equipe-medica/pacientes/page.tsx",
      "src/app/equipe-medica/pacientes/[patientId]/page.tsx",
      "src/app/equipe-medica/pacientes/[patientId]/historico/page.tsx",
      "src/app/equipe-medica/pacientes/[patientId]/relatorio/page.tsx",
    ];

    for (const path of dynamicPages) {
      expect(readRepo(path)).toContain('export const dynamic = "force-dynamic"');
      expect(readRepo(path)).not.toContain("unstable_cache");
    }

    const medicalSources = [
      ...listSourceFiles("src/app/equipe-medica"),
      ...listSourceFiles("src/features/medical-team"),
    ];

    for (const path of medicalSources) {
      const source = readRepo(path);
      expect(source).not.toContain("unstable_cache");
      expect(source).not.toContain("revoke-access-authorization-action");
      expect(source).not.toContain("use-daily-record-form");
      expect(source).not.toContain("profile-settings-form");
    }
  });
});

describe("patient authorization mutations derive identity from the session", () => {
  beforeEach(() => {
    state.userId = PATIENT_ID;
    state.inserts = [];
    state.updates = [];
    state.rows = [
      {
        id: AUTHORIZATION_ID,
        patient_id: PATIENT_ID,
        revoked_at: null,
      },
    ];
  });

  test("the authorize action inserts the authenticated user id", async () => {
    const { useAuthorizeMedicalTeamMemberForm } = await import(
      "@/features/access-authorizations/hooks/use-authorize-medical-team-member-form"
    );
    const { result } = renderHook(() => useAuthorizeMedicalTeamMemberForm());

    await act(async () => {
      result.current.onCodeChange({
        target: { value: "ABCD2345" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleLookupSubmit({
        preventDefault() {},
      } as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.flowState.kind).toBe("found");

    act(() => {
      result.current.handleOpenConfirmation();
    });

    await act(async () => {
      await result.current.handleConfirmAuthorize();
    });

    expect(state.inserts).toEqual([
      {
        patient_id: PATIENT_ID,
        professional_id: PROFESSIONAL_ID,
      },
    ]);
  });

  test("a medical session cannot revoke a patient-owned authorization through the patient action", async () => {
    state.userId = MEDICAL_ID;
    const { RevokeAccessAuthorizationAction } = await import(
      "@/features/access-authorizations/components/revoke-access-authorization-action"
    );
    const user = userEvent.setup();

    render(<RevokeAccessAuthorizationAction authorizationId={AUTHORIZATION_ID} />);
    await user.click(screen.getByRole("button", { name: "Revogar acesso" }));
    const buttons = screen.getAllByRole("button", { name: "Revogar acesso" });
    await user.click(buttons[buttons.length - 1]);

    expect(await screen.findByText(AUTHORIZATION_REVOKE_NO_ROW_MESSAGE)).toBeVisible();
    expect(state.updates[0]?.filters).toEqual(
      expect.arrayContaining([
        { operator: "eq", column: "patient_id", value: MEDICAL_ID },
        { operator: "eq", column: "id", value: AUTHORIZATION_ID },
        { operator: "is", column: "revoked_at", value: null },
      ])
    );
    expect(state.rows[0]?.revoked_at).toBeNull();
  });

  test("the owning patient can revoke through the same action", async () => {
    const { RevokeAccessAuthorizationAction } = await import(
      "@/features/access-authorizations/components/revoke-access-authorization-action"
    );
    const user = userEvent.setup();

    render(<RevokeAccessAuthorizationAction authorizationId={AUTHORIZATION_ID} />);
    await user.click(screen.getByRole("button", { name: "Revogar acesso" }));
    const buttons = screen.getAllByRole("button", { name: "Revogar acesso" });
    await user.click(buttons[buttons.length - 1]);

    expect(state.updates[0]?.filters).toEqual(
      expect.arrayContaining([
        { operator: "eq", column: "patient_id", value: PATIENT_ID },
      ])
    );
    expect(state.rows[0]?.revoked_at).toEqual(expect.any(String));
  });

  test("patient route and write modules keep medical callers out of patient mutations", () => {
    const layout = readRepo("src/app/paciente/layout.tsx");
    expect(layout).toContain('result.role === "medical"');
    expect(layout).toContain('redirect("/equipe-medica")');

    const pdf = readRepo("src/app/paciente/relatorio/pdf/route.ts");
    expect(pdf).toContain('caller.role !== "patient"');
    expect(pdf).toContain("status: 403");

    const insert = readRepo(
      "src/features/daily-records/hooks/use-daily-record-form.ts"
    );
    const edit = readRepo(
      "src/features/daily-records/hooks/use-daily-record-edit-form.ts"
    );
    const remove = readRepo(
      "src/features/history/components/daily-record-delete-action.tsx"
    );
    const profile = readRepo(
      "src/features/profile/components/profile-settings-form.tsx"
    );

    for (const source of [insert, edit, remove, profile]) {
      expect(source).toContain("auth.getUser()");
      expect(source).not.toContain("service_role");
    }

    expect(insert).toContain("authResult.user.id");
    expect(edit).toContain('.eq("patient_id", authResult.user.id)');
    expect(remove).toContain('.eq("patient_id", authResult.user.id)');
    expect(profile).toContain('.eq("id", user.id)');
  });
});
