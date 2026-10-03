import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("offline fallback page", () => {
  test("keeps one public static route with the required copy", () => {
    assert.equal(existsSync(join(repoRoot, "src/app/offline/page.tsx")), true);
    assert.equal(existsSync(join(repoRoot, "src/app/_offline")), false);
    assert.equal(existsSync(join(repoRoot, "src/app/~offline")), false);

    const page = readRepoFile("src/app/offline/page.tsx");
    const view = readRepoFile("src/features/pwa/components/offline-page.tsx");
    const retry = readRepoFile(
      "src/features/pwa/components/offline-retry-button.tsx"
    );

    assert.match(page, /export const dynamic = "force-static"/);
    assert.match(page, /title: "Sem conexão"/);
    assert.doesNotMatch(page, /["']use client["']/);
    assert.equal(view.match(/<h1[\s>]/g)?.length, 1);
    assert.match(view, /Sem conexão/);
    assert.match(
      view,
      /Não foi possível acessar o AsthmaTrack porque seu dispositivo\s+está\s+offline\./
    );
    assert.match(view, /Verifique sua conexão e tente novamente\./);
    assert.match(view, /<main[\s>]/);
    assert.match(view, /href="\/"/);
    assert.match(view, /prefetch=\{false\}/);
    assert.match(view, /Voltar ao início/);
    assert.match(retry, /Tentar novamente/);
    assert.match(retry, /Tentando novamente\.\.\./);
    assert.match(retry, /type="button"/);
    assert.match(retry, /window\.location\.assign\("\/"\)/);
    assert.match(retry, /["']use client["']/);
  });

  test("does not query data, listen for connectivity, or expose private routes", () => {
    const sources = [
      "src/app/offline/page.tsx",
      "src/features/pwa/components/offline-page.tsx",
      "src/features/pwa/components/offline-retry-button.tsx",
    ].map(readRepoFile);
    const combined = sources.join("\n");

    assert.doesNotMatch(combined, /PatientShell|MedicalTeamShell/);
    assert.doesNotMatch(combined, /\/paciente|\/equipe-medica/);
    assert.doesNotMatch(
      combined,
      /supabase|getClaims|getUser|cookies\(|headers\(/
    );
    assert.doesNotMatch(combined, /navigator\.onLine/);
    assert.doesNotMatch(combined, /addEventListener/);
    assert.doesNotMatch(combined, /setInterval|setTimeout/);
    assert.doesNotMatch(combined, /localStorage|sessionStorage|indexedDB/i);
    assert.doesNotMatch(combined, /serviceWorker|caches\.open/);
    assert.doesNotMatch(
      readRepoFile("src/features/pwa/components/offline-page.tsx"),
      /useEffect|useState/
    );
    assert.doesNotMatch(
      readRepoFile("src/features/pwa/components/offline-retry-button.tsx"),
      /useEffect/
    );
  });

  test("skips session refresh for the exact offline path only", () => {
    const proxy = readRepoFile("src/proxy.ts");
    const offlineCheck = proxy.indexOf('pathname === "/offline"');
    const sessionCall = proxy.indexOf("updateSupabaseSession(");

    assert.ok(offlineCheck > -1);
    assert.ok(sessionCall > offlineCheck);
    assert.match(proxy, /pathname\.startsWith\("\/paciente"\)/);
    assert.match(proxy, /pathname\.startsWith\("\/equipe-medica"\)/);
    assert.equal(existsSync(join(repoRoot, "public/sw.js")), false);
    assert.equal(existsSync(join(repoRoot, "public/service-worker.js")), false);
  });
});
