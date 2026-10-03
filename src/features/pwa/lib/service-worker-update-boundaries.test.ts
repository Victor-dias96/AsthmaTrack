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

    if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
      found.push(relativeEntry);
    }
  }

  return found;
}

const appSources = listSourceFiles("src");

describe("service worker update boundaries", () => {
  test("mounts one update notice on the existing root client boundary", () => {
    const mounts = appSources
      .filter((path) =>
        readRepoFile(path).includes("<ServiceWorkerUpdateNotice")
      )
      .sort();
    const providers = appSources
      .filter((path) =>
        readRepoFile(path).includes("<ServiceWorkerUpdateProvider>")
      )
      .sort();
    const owners = appSources
      .filter((path) =>
        /useServiceWorkerUpdateOwner\(\);/.test(readRepoFile(path))
      )
      .sort();
    const notices = appSources
      .filter((path) => /useServiceWorkerUpdate\(\);/.test(readRepoFile(path)))
      .sort();
    const bridges = appSources
      .filter((path) =>
        /useServiceWorkerRegistrationBridge\(\);/.test(readRepoFile(path))
      )
      .sort();

    assert.deepEqual(mounts, [
      "src/features/pwa/components/pwa-client-features.tsx",
    ]);
    assert.deepEqual(providers, [
      "src/features/pwa/components/pwa-client-features.tsx",
    ]);
    assert.deepEqual(owners, [
      "src/features/pwa/components/service-worker-update-provider.tsx",
    ]);
    assert.deepEqual(notices, [
      "src/features/pwa/components/service-worker-update-notice.tsx",
    ]);
    assert.deepEqual(bridges, [
      "src/features/pwa/components/service-worker-registration.tsx",
    ]);
    assert.equal(
      readRepoFile("src/features/pwa/lib/register-service-worker.ts").match(
        /\.register\(/g
      )?.length,
      1
    );
    assert.doesNotMatch(
      readRepoFile("src/app/layout.tsx"),
      /["']use client["']/
    );
    assert.doesNotMatch(
      readRepoFile("src/components/layout/patient-shell.tsx"),
      /ServiceWorkerUpdateNotice|addEventListener/
    );
    assert.doesNotMatch(
      readRepoFile(
        "src/features/medical-team/components/medical-team-shell.tsx"
      ),
      /ServiceWorkerUpdateNotice|addEventListener/
    );
  });

  test("keeps the notice polite, explicit, and free of private data", () => {
    const notice = readRepoFile(
      "src/features/pwa/components/service-worker-update-notice.tsx"
    );
    const logic = stripComments(
      readRepoFile("src/features/pwa/lib/service-worker-update.ts")
    );
    const worker = stripComments(readRepoFile("public/sw.js"));
    const combined = `${notice}\n${logic}`;

    assert.match(notice, /role="status"/);
    assert.match(notice, /aria-live="polite"/);
    assert.match(notice, /aria-busy=/);
    assert.match(notice, /aria-hidden="true"/);
    assert.match(notice, /type="button"/);
    assert.match(notice, /SERVICE_WORKER_UPDATE_TITLE/);
    assert.match(notice, /SERVICE_WORKER_UPDATE_BODY/);
    assert.match(notice, /SERVICE_WORKER_UPDATE_ACTION/);
    assert.match(notice, /SERVICE_WORKER_UPDATE_LATER/);
    assert.match(notice, /SERVICE_WORKER_UPDATE_BUSY/);
    assert.match(combined, /Nova versão disponível/);
    assert.match(
      combined,
      /Atualize o AsthmaTrack para usar a versão mais recente/
    );
    assert.match(combined, /Atualizar agora/);
    assert.match(combined, /Depois/);
    assert.match(combined, /Atualizando\.\.\./);
    assert.match(combined, /Não foi possível aplicar a atualização agora/);
    assert.match(notice, /z-30/);
    assert.match(notice, /safe-area-inset-top/);
    assert.match(notice, /motion-reduce:transition-none/);
    assert.match(notice, /break-words/);
    assert.match(notice, /isServiceWorkerUpdateNoticeVisible/);
    assert.doesNotMatch(notice, /role="alert"/);
    assert.doesNotMatch(notice, /autoFocus|dangerouslySetInnerHTML/);
    assert.doesNotMatch(combined, /localStorage|sessionStorage|indexedDB/);
    assert.doesNotMatch(combined, /setInterval|registration\.update\(/);
    assert.doesNotMatch(combined, /location\.reload/);
    assert.doesNotMatch(
      combined,
      /patientId|fullName|email|pef|sintoma|authorization/i
    );
    assert.match(logic, /type: "SKIP_WAITING"/);
    assert.equal(worker.match(/\.skipWaiting\s*\(/g)?.length, 1);
    assert.doesNotMatch(worker, /clients\.claim\s*\(/);
    assert.doesNotMatch(
      readRepoFile("package.json"),
      /workbox|serwist|next-pwa/
    );
  });
});
