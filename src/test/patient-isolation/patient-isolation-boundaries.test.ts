// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

/**
 * Static guards for the Issue 130 patient-isolation architecture. They do
 * not prove isolation on their own -- the runtime suites in this folder and
 * supabase/tests/database/patient_isolation.test.sql do -- but they make a
 * new unscoped daily_records query, a service_role client, or a broadened
 * daily_records policy fail review before any runtime test is written.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function listFiles(relativeDir: string, pattern: RegExp): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(join(repoRoot, relativeDir), { withFileTypes: true })) {
    const relativeEntry = posix.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      found.push(...listFiles(relativeEntry, pattern));
    } else if (pattern.test(entry.name)) {
      found.push(relativeEntry);
    }
  }

  return found;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function stripSqlComments(sql: string): string {
  return sql.replace(/--.*$/gm, "");
}

const applicationSources = listFiles("src", /\.tsx?$/)
  .filter((path) => !/\.test\.tsx?$/.test(path) && !path.startsWith("src/test/"))
  .map((path) => ({ path, code: stripComments(readRepoFile(path)) }));

/** Each `.from("daily_records")` chain up to the end of its statement. */
function dailyRecordChains(code: string): string[] {
  return [...code.matchAll(/\.from\(\s*["']daily_records["']\s*\)([\s\S]*?);/g)].map(
    ([, chain]) => chain
  );
}

const migrations = listFiles("supabase/migrations", /\.sql$/)
  .sort()
  .map((path) => ({ path, sql: stripSqlComments(readRepoFile(path)) }));

describe("isolamento entre pacientes: consultas da aplicação", () => {
  const sitesByFile = applicationSources
    .map(({ path, code }) => ({ path, chains: dailyRecordChains(code) }))
    .filter(({ chains }) => chains.length > 0);

  test("lista conhecida de arquivos que acessam daily_records", () => {
    // A new file here needs an owner filter and a runtime isolation test.
    expect(sitesByFile.map(({ path }) => path).sort()).toEqual([
      "src/features/daily-records/hooks/use-daily-record-edit-form.ts",
      "src/features/daily-records/hooks/use-daily-record-form.ts",
      "src/features/dashboard/lib/load-patient-dashboard-data.ts",
      "src/features/history/components/daily-record-delete-action.tsx",
      "src/features/history/lib/load-patient-daily-record.ts",
      "src/features/history/lib/load-patient-history.ts",
      "src/features/reports/server/get-patient-report-data.ts",
    ]);
  });

  test("toda leitura, alteração e exclusão filtra pelo paciente", () => {
    for (const { path, chains } of sitesByFile) {
      for (const chain of chains) {
        if (/^\s*\.insert\(/.test(chain)) {
          continue;
        }

        expect(chain, path).toMatch(/\.eq\(\s*"patient_id",/);
      }
    }
  });

  test("consultas por ID de registro também filtram pelo dono", () => {
    for (const { path, chains } of sitesByFile) {
      for (const chain of chains.filter((c) => /\.eq\(\s*"id",/.test(c))) {
        expect(chain, path).toMatch(/\.eq\(\s*"patient_id",\s*(session\.userId|authResult\.user\.id)\s*\)/);
      }
    }
  });

  test("a inserção recebe o dono apenas do usuário verificado", () => {
    const createHook = stripComments(
      readRepoFile("src/features/daily-records/hooks/use-daily-record-form.ts")
    );

    expect(createHook).toMatch(
      /buildDailyRecordInsertPayload\(\s*result\.data,\s*recordedAtIso,\s*authResult\.user\.id\s*\)/
    );
  });

  test("nenhum código da aplicação usa service_role ou chave secreta", () => {
    for (const { path, code } of applicationSources) {
      expect(code, path).not.toMatch(/service_role/i);
      expect(code, path).not.toMatch(/SUPABASE_SERVICE_ROLE|SUPABASE_SECRET/);
      // Only the cookie-bound @supabase/ssr clients may reach the database.
      expect(code, path).not.toMatch(
        /import\s*\{[^}]*\bcreateClient\b[^}]*\}\s*from\s*["']@supabase\/supabase-js["']/
      );
    }
  });

  test("nenhuma rota do paciente lê identidade de parâmetros da URL", () => {
    const patientRoutes = applicationSources.filter(({ path }) =>
      path.startsWith("src/app/paciente/")
    );

    expect(patientRoutes.length).toBeGreaterThan(5);
    for (const { path, code } of patientRoutes) {
      expect(code, path).not.toMatch(/params\??\.\s*(patientId|patient_id|userId)\b/);
      expect(code, path).not.toMatch(/searchParams\.get\(\s*["'](patientId|patient_id|userId)["']/);
      expect(code, path).not.toMatch(/\[\s*["'](patientId|patient_id|userId)["']\s*\]/);
    }
  });
});

describe("isolamento entre pacientes: políticas de daily_records", () => {
  const OWNER = "patient_id = (select auth.uid())";

  const dailyRecordStatements = migrations.flatMap(({ path, sql }) =>
    sql
      .split(";")
      .map((statement) => statement.replace(/\s+/g, " ").trim())
      .filter((statement) => /\bpublic\.daily_records\b/.test(statement))
      .map((statement) => ({ path, statement }))
  );

  const policies = dailyRecordStatements
    .filter(({ statement }) => /^create policy/i.test(statement))
    .map(({ statement }) => {
      const [, name, command] =
        /^create policy "([^"]+)" on public\.daily_records for (\w+)/i.exec(statement) ?? [];
      const using = /\busing \((.*?)\)(?: with check|$)/i.exec(statement)?.[1];
      const withCheck = /\bwith check \((.*)\)$/i.exec(statement)?.[1];
      return { name, command, to: /\bto (\w+)/i.exec(statement)?.[1], using, withCheck };
    });

  test("RLS habilitada e nunca desabilitada", () => {
    const rlsStatements = dailyRecordStatements
      .map(({ statement }) => statement)
      .filter((statement) => /row level security/i.test(statement));

    expect(rlsStatements).toEqual([
      "alter table public.daily_records enable row level security",
    ]);
  });

  test("exatamente uma política por operação, todas presas ao dono", () => {
    expect(policies).toEqual([
      { name: "Users can select own daily records", command: "select", to: "authenticated", using: OWNER, withCheck: undefined },
      { name: "Users can insert own daily records", command: "insert", to: "authenticated", using: undefined, withCheck: OWNER },
      { name: "Users can update own daily records", command: "update", to: "authenticated", using: OWNER, withCheck: OWNER },
      { name: "Users can delete own daily records", command: "delete", to: "authenticated", using: OWNER, withCheck: undefined },
    ]);
  });

  test("anon sem privilégios e authenticated apenas com CRUD", () => {
    const grants = dailyRecordStatements
      .map(({ statement }) => statement)
      .filter((statement) => /^(grant|revoke)\b/i.test(statement));

    expect(grants).toEqual([
      "revoke all on public.daily_records from anon",
      "revoke all on public.daily_records from authenticated",
      "revoke all on public.daily_records from anon",
      "revoke all on public.daily_records from authenticated",
      "grant select, insert, update, delete on public.daily_records to authenticated",
    ]);
  });

  test("nenhuma função do banco escreve em daily_records", () => {
    for (const { path, sql } of migrations) {
      expect(sql, path).not.toMatch(/\binsert into public\.daily_records\b/i);
      expect(sql, path).not.toMatch(/\bupdate public\.daily_records\b/i);
      expect(sql, path).not.toMatch(/\bdelete from public\.daily_records\b/i);
    }
  });
});
