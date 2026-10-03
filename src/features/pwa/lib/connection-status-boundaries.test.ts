import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
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

    if (/\.tsx?$/.test(entry.name)) {
      found.push(relativeEntry);
    }
  }

  return found;
}

const appSources = listSourceFiles("src").filter(
  (path) => !path.endsWith(".test.ts")
);

describe("connection status boundaries", () => {
  test("mounts one indicator on the existing root client boundary", () => {
    const mounts = appSources
      .filter((path) =>
        readRepoFile(path).includes("<ConnectionStatusIndicator")
      )
      .sort();
    const callers = appSources
      .filter((path) => /useConnectionStatus\(\);/.test(readRepoFile(path)))
      .sort();

    assert.deepEqual(mounts, [
      "src/features/pwa/components/pwa-client-features.tsx",
    ]);
    assert.deepEqual(callers, [
      "src/features/pwa/components/connection-status-indicator.tsx",
    ]);
    assert.equal(
      readRepoFile("src/features/pwa/components/pwa-client-features.tsx").match(
        /<ConnectionStatusIndicator \/>/g
      )?.length,
      1
    );
    assert.doesNotMatch(
      readRepoFile("src/app/layout.tsx"),
      /["']use client["']/
    );
    assert.doesNotMatch(
      readRepoFile("src/components/layout/patient-shell.tsx"),
      /ConnectionStatusIndicator|addEventListener/
    );
    assert.doesNotMatch(
      readRepoFile(
        "src/features/medical-team/components/medical-team-shell.tsx"
      ),
      /ConnectionStatusIndicator|addEventListener/
    );
  });

  test("owns one online listener and one offline listener in the PWA feature", () => {
    const pwaSources = listSourceFiles("src/features/pwa").filter(
      (path) => !path.endsWith(".test.ts")
    );
    const onlineOwners = pwaSources
      .filter((path) =>
        /addEventListener\(\s*["']online["']/.test(
          stripComments(readRepoFile(path))
        )
      )
      .sort();
    const offlineOwners = pwaSources
      .filter((path) =>
        /addEventListener\(\s*["']offline["']/.test(
          stripComments(readRepoFile(path))
        )
      )
      .sort();

    assert.deepEqual(onlineOwners, [
      "src/features/pwa/lib/connection-status.ts",
    ]);
    assert.deepEqual(offlineOwners, [
      "src/features/pwa/lib/connection-status.ts",
    ]);

    const hook = readRepoFile(
      "src/features/pwa/hooks/use-connection-status.ts"
    );
    assert.match(hook, /useState<ConnectionStatus>\("unknown"\)/);
    assert.match(hook, /return startConnectionStatus\(window, setStatus\)/);
    assert.doesNotMatch(hook, /navigator/);
    assert.doesNotMatch(hook, /localStorage|sessionStorage|indexedDB|fetch\(/);
  });

  test("keeps the notice accessible, neutral, and free of private data", () => {
    const indicator = readRepoFile(
      "src/features/pwa/components/connection-status-indicator.tsx"
    );
    const logic = stripComments(
      readRepoFile("src/features/pwa/lib/connection-status.ts")
    );
    const combined = `${indicator}\n${logic}`;

    assert.match(indicator, /role="status"/);
    assert.match(indicator, /aria-live="polite"/);
    assert.match(indicator, /aria-hidden="true"/);
    assert.match(indicator, /pathname === "\/offline"/);
    assert.match(indicator, /CONNECTION_RECOVERY_NOTICE_MS/);
    assert.equal(indicator.match(/window\.setTimeout/g)?.length, 1);
    assert.match(indicator, /window\.clearTimeout/);
    assert.match(indicator, /z-30/);
    assert.match(indicator, /pointer-events-none/);
    assert.match(indicator, /safe-area-inset-top/);
    assert.match(indicator, /break-words/);
    assert.match(logic, /Você está offline/);
    assert.match(logic, /Conexão restabelecida/);
    assert.doesNotMatch(indicator, /role="alert"/);
    assert.doesNotMatch(indicator, /<button|AppButton|type="button"/);
    assert.doesNotMatch(combined, /Nova versão|SKIP_WAITING|skipWaiting/);
    assert.doesNotMatch(combined, /localStorage|sessionStorage|indexedDB/);
    assert.doesNotMatch(
      combined,
      /fetch\(|XMLHttpRequest|supabase|serviceWorker/
    );
    assert.doesNotMatch(combined, /setInterval|caches\.open|sync\.register/);
    assert.doesNotMatch(
      combined,
      /patientId|fullName|email|pef|sintoma|authorization/i
    );
    assert.doesNotMatch(indicator, /dangerouslySetInnerHTML/);
    assert.doesNotMatch(
      readRepoFile("public/sw.js"),
      /addEventListener\(\s*["']online["']|addEventListener\(\s*["']offline["']/
    );
  });
});
