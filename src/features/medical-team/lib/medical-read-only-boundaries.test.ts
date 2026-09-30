import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix, sep } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const featureRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(featureRoot, "..", "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function listSourceFiles(relativeDir: string): string[] {
  const absoluteDir = join(repoRoot, relativeDir);
  const found: string[] = [];

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativeEntry = posix.join(relativeDir, entry.name);

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

/**
 * Strips line and block comments so a source assertion reflects executable
 * code and rendered JSX text, not the explanatory prose this codebase uses
 * heavily (e.g. the "Novo registro" mention in
 * src/features/medical-team/constants/nav-items.ts, which documents an
 * intentionally *absent* patient-only link).
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * Same intent as stripComments for SQL: these migrations document what they
 * deliberately do *not* do (e.g. "service_role is not used"), so only the
 * executable DDL may be asserted against.
 */
function stripSqlComments(sql: string): string {
  return sql.replace(/--.*$/gm, "");
}

const MEDICAL_SOURCE_DIRS = [
  "src/app/equipe-medica",
  "src/features/medical-team",
] as const;

const medicalSources = MEDICAL_SOURCE_DIRS.flatMap((dir) =>
  listSourceFiles(dir)
).map((relativePath) => ({
  path: relativePath.split(sep).join("/"),
  code: stripComments(readRepoFile(relativePath)),
}));

describe("medical-team write-surface boundaries", () => {
  test("finds every medical source file", () => {
    // Guards the traversal itself: an empty or tiny list would make every
    // other assertion in this suite pass vacuously.
    assert.ok(medicalSources.length > 40, `found ${medicalSources.length}`);
    assert.ok(
      medicalSources.some((file) => file.path.endsWith("/layout.tsx"))
    );
  });

  test("contains no Supabase write call", () => {
    for (const { path, code } of medicalSources) {
      assert.doesNotMatch(code, /\.insert\s*\(/, path);
      assert.doesNotMatch(code, /\.update\s*\(/, path);
      assert.doesNotMatch(code, /\.delete\s*\(/, path);
      assert.doesNotMatch(code, /\.upsert\s*\(/, path);
    }
  });

  test("declares no Server Action and no mutating Route Handler", () => {
    for (const { path, code } of medicalSources) {
      assert.doesNotMatch(code, /["']use server["']/, path);
      assert.doesNotMatch(
        code,
        /export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)\b/,
        path
      );
    }
  });

  test("calls only the three read-only medical RPCs", () => {
    const allowedRpcs = [
      "get_medical_authorized_patients",
      "get_medical_authorized_patient_latest_records",
      "get_medical_authorized_patient_period_records",
    ];

    for (const { path, code } of medicalSources) {
      for (const [, name] of code.matchAll(/\.rpc\(\s*["']([^"']+)["']/g)) {
        assert.ok(allowedRpcs.includes(name), `${path}: ${name}`);
      }
      // Health data reaches the medical UI only through those functions,
      // never through a direct table read that RLS would have to scope.
      assert.doesNotMatch(code, /\.from\(\s*["']daily_records["']/, path);
      assert.doesNotMatch(code, /\.from\(\s*["']profiles["']/, path);
      assert.doesNotMatch(
        code,
        /\.from\(\s*["']patient_access_authorizations["']/,
        path
      );
    }
  });

  test("renders no write control and no prefilled health input", () => {
    for (const { path, code } of medicalSources) {
      assert.doesNotMatch(code, /contentEditable/i, path);
      assert.doesNotMatch(code, /<textarea/i, path);
      assert.doesNotMatch(code, /draggable/i, path);
      assert.doesNotMatch(code, /method=["']post["']/i, path);
      assert.doesNotMatch(
        code,
        /\b(Novo registro|Registrar crise|Editar|Excluir|Duplicar|Salvar|Revogar|Reativar|Prescri|Aprovar)/,
        path
      );
      // No disabled write control is left behind as a misleading affordance.
      assert.doesNotMatch(code, /disabled[\s\S]{0,40}(Editar|Excluir)/, path);
    }
  });

  test("keeps the single search field as the only medical form input", () => {
    const withInputs = medicalSources
      .filter(({ code }) => /<form|<AppInput|<input/i.test(code))
      .map(({ path }) => path);

    assert.deepEqual(withInputs, [
      "src/features/medical-team/components/authorized-patient-search.tsx",
    ]);

    const search = medicalSources.find((file) =>
      file.path.endsWith("authorized-patient-search.tsx")
    );

    assert.ok(search);
    assert.match(search.code, /method="get"/);
    assert.doesNotMatch(search.code, /onSubmit/);
  });

  test("never links a medical user to a patient-owned route", () => {
    for (const { path, code } of medicalSources) {
      assert.doesNotMatch(code, /novo-registro/, path);
      assert.doesNotMatch(code, /\/editar/, path);
      assert.doesNotMatch(code, /\/paciente\/historico/, path);
      assert.doesNotMatch(code, /\/paciente\/relatorio/, path);
      assert.doesNotMatch(code, /\/paciente\/configuracoes/, path);
      assert.doesNotMatch(code, /navigator\.share/, path);
      assert.doesNotMatch(code, /window\.print/, path);
    }

    // The only patient path the medical subtree may mention at all is the
    // /equipe-medica layout's server-side redirect for a patient role.
    const patientPathMentions = medicalSources.flatMap(({ path, code }) =>
      [...code.matchAll(/\/paciente\/[a-z-]+/g)].map(
        ([match]) => `${path}: ${match}`
      )
    );

    assert.deepEqual(patientPathMentions, [
      "src/app/equipe-medica/layout.tsx: /paciente/dashboard",
    ]);
  });

  test("keeps the read-only label on every medical health surface", () => {
    const labelled = [
      "src/features/medical-team/components/authorized-patient-item.tsx",
      "src/features/medical-team/components/medical-patient-dashboard-header.tsx",
      "src/features/medical-team/components/medical-patient-history-header.tsx",
      "src/features/medical-team/components/medical-patient-report-header.tsx",
    ];

    for (const path of labelled) {
      assert.match(readRepoFile(path), /Somente leitura/, path);
    }
  });
});

describe("patient-only write surfaces reject medical callers", () => {
  test("redirects a medical role out of the patient route subtree", () => {
    const layout = readRepoFile("src/app/paciente/layout.tsx");

    assert.match(layout, /loadVerifiedProfileRole/);
    assert.match(layout, /role === "medical"/);
    assert.match(layout, /redirect\("\/equipe-medica"\)/);
    assert.doesNotMatch(layout, /["']use client["']/);
    assert.doesNotMatch(layout, /useEffect/);
  });

  test("re-verifies the persisted patient role in the PDF Route Handler", () => {
    // Route Handlers are not wrapped by src/app/paciente/layout.tsx, so this
    // endpoint has to repeat the role check itself.
    const route = readRepoFile("src/app/paciente/relatorio/pdf/route.ts");

    assert.match(route, /loadVerifiedProfileRole/);
    assert.match(route, /caller\.role !== "patient"/);
    assert.match(route, /status: 403/);
    assert.doesNotMatch(route, /searchParams\.get\(\s*["']patientId["']/);
    assert.doesNotMatch(route, /service_role/);
  });

  test("derives ownership from the verified session in every patient write", () => {
    const writeSurfaces = [
      "src/features/daily-records/hooks/use-daily-record-form.ts",
      "src/features/daily-records/hooks/use-daily-record-edit-form.ts",
      "src/features/history/components/daily-record-delete-action.tsx",
      "src/features/access-authorizations/hooks/use-authorize-medical-team-member-form.ts",
      "src/features/access-authorizations/components/revoke-access-authorization-action.tsx",
      "src/features/profile/components/profile-settings-form.tsx",
      "src/features/onboarding/components/onboarding-form.tsx",
    ];

    for (const path of writeSurfaces) {
      const code = stripComments(readRepoFile(path));

      assert.match(code, /auth\.getUser\(\)/, path);
      assert.doesNotMatch(code, /auth\.getSession\(\)/, path);
      assert.doesNotMatch(code, /service_role/, path);
      // Ownership is never taken from a prop, a URL segment or a role value
      // the browser could supply.
      assert.doesNotMatch(code, /patient_id:\s*(props|patientId)\b/, path);
      assert.doesNotMatch(code, /role:\s*["']/, path);
    }
  });
});

describe("database read-only posture", () => {
  const dailyRecordsRls = stripSqlComments(
    readRepoFile("supabase/migrations/20260826153200_add_daily_records_rls.sql")
  );
  const authorizationPolicies = stripSqlComments(
    readRepoFile(
      "supabase/migrations/20260904160000_add_patient_access_authorization_policies.sql"
    )
  );
  test("binds every daily_records write policy to the owning patient", () => {
    for (const operation of ["insert", "update", "delete"]) {
      assert.match(
        dailyRecordsRls,
        new RegExp(`for ${operation}[\\s\\S]*?patient_id = \\(select auth\\.uid\\(\\)\\)`)
      );
    }

    assert.doesNotMatch(dailyRecordsRls, /using\s*\(\s*true\s*\)/i);
    assert.doesNotMatch(dailyRecordsRls, /with check\s*\(\s*true\s*\)/i);
    assert.doesNotMatch(dailyRecordsRls, /'medical'/);
    assert.doesNotMatch(dailyRecordsRls, /to anon/i);
    assert.doesNotMatch(dailyRecordsRls, /grant all/i);
    assert.doesNotMatch(dailyRecordsRls, /disable row level security/i);
  });

  test("gives professionals no authorization-row write path", () => {
    assert.match(
      authorizationPolicies,
      /grant insert \(patient_id, professional_id\)/
    );
    assert.match(authorizationPolicies, /grant update \(revoked_at\)/);
    assert.doesNotMatch(authorizationPolicies, /grant delete/i);
    assert.doesNotMatch(authorizationPolicies, /for delete/i);
    assert.doesNotMatch(authorizationPolicies, /using\s*\(\s*true\s*\)/i);
    assert.doesNotMatch(authorizationPolicies, /with check\s*\(\s*true\s*\)/i);

    // The only UPDATE policy is the owning patient's one-way revocation.
    // `[^;]*?` keeps each match inside a single statement so a policy name
    // can never be paired with a later statement's operation.
    const updatePolicies = [
      ...authorizationPolicies.matchAll(
        /create policy "([^"]+)"[^;]*?for update/g
      ),
    ].map(([, name]) => name);

    assert.deepEqual(updatePolicies, [
      "Patients can revoke own access authorizations",
    ]);
  });

  test("keeps every medical function select-only and authenticated-only", () => {
    const medicalFunctionMigrations = [
      "supabase/migrations/20260908140000_add_medical_authorized_patients_lookup.sql",
      "supabase/migrations/20260908180000_add_medical_authorized_patient_latest_record.sql",
      "supabase/migrations/20260908190000_add_medical_authorized_patient_dashboard.sql",
    ];

    for (const path of medicalFunctionMigrations) {
      const sql = stripSqlComments(readRepoFile(path));

      assert.match(sql, /language sql/, path);
      assert.match(sql, /\bstable\b/, path);
      assert.match(sql, /set search_path = public/, path);
      assert.match(sql, /private\.profile_has_role/, path);
      assert.match(sql, /revoked_at is null/, path);
      assert.match(sql, /\(select auth\.uid\(\)\)/, path);
      assert.match(sql, /from public\./, path);
      assert.match(sql, /revoke all on function[\s\S]*?from anon/, path);
      assert.match(sql, /grant execute on function[\s\S]*?to authenticated/, path);

      assert.doesNotMatch(sql, /\binsert into\b/i, path);
      assert.doesNotMatch(sql, /\bupdate public\./i, path);
      assert.doesNotMatch(sql, /\bdelete from\b/i, path);
      assert.doesNotMatch(sql, /\bexecute\s+format\b/i, path);
      assert.doesNotMatch(sql, /\bvolatile\b/i, path);
      assert.doesNotMatch(sql, /service_role/i, path);
      assert.doesNotMatch(sql, /to public\b/i, path);
      assert.doesNotMatch(sql, /create policy/i, path);
    }
  });
});
