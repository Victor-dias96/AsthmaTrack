import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import manifest from "../../../app/manifest";

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

function readPngSize(relativePath: string): { width: number; height: number } {
  const bytes = readFileSync(join(repoRoot, relativePath));
  assert.equal(
    bytes.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    relativePath
  );
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR", relativePath);

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

describe("PWA installation boundaries", () => {
  test("keeps a single install card outside login and record flows", () => {
    const sources = listSourceFiles("src").filter(
      (path) => !path.endsWith(".test.ts")
    );
    const mounts = sources
      .filter((path) => readRepoFile(path).includes("<PwaInstallCard"))
      .sort();

    assert.deepEqual(mounts, [
      "src/app/equipe-medica/page.tsx",
      "src/app/paciente/configuracoes/page.tsx",
    ]);
  });

  test("registers beforeinstallprompt in one controller", () => {
    const sources = listSourceFiles("src").filter(
      (path) => !path.endsWith(".test.ts")
    );
    const owners = sources
      .filter((path) =>
        /addEventListener\(\s*["']beforeinstallprompt["']/.test(
          stripComments(readRepoFile(path))
        )
      )
      .sort();

    assert.deepEqual(owners, [
      "src/features/pwa/lib/pwa-installation-session.ts",
    ]);
  });

  test("keeps the root layout as a server component", () => {
    const layout = readRepoFile("src/app/layout.tsx");

    assert.match(layout, /PwaClientFeatures/);
    assert.doesNotMatch(layout, /["']use client["']/);
    assert.match(
      readRepoFile("src/features/pwa/components/pwa-client-features.tsx"),
      /PwaInstallationProvider/
    );
    assert.doesNotMatch(
      readRepoFile("src/app/paciente/layout.tsx"),
      /["']use client["']/
    );
    assert.doesNotMatch(
      readRepoFile("src/app/equipe-medica/layout.tsx"),
      /["']use client["']/
    );
    assert.doesNotMatch(
      readRepoFile("src/app/paciente/layout.tsx"),
      /ServiceWorkerRegistration/
    );
    assert.doesNotMatch(
      readRepoFile("src/app/equipe-medica/layout.tsx"),
      /ServiceWorkerRegistration/
    );
  });

  test("keeps the install hook free of prompt calls and browser storage", () => {
    const hook = stripComments(
      readRepoFile("src/features/pwa/hooks/use-pwa-installation.ts")
    );
    const effect = hook.slice(
      hook.indexOf("useEffect"),
      hook.indexOf("const install")
    );
    const card = stripComments(
      readRepoFile("src/features/pwa/components/pwa-install-card.tsx")
    );
    const feature = listSourceFiles("src/features/pwa")
      .filter((path) => !path.endsWith(".test.ts"))
      .map((path) => stripComments(readRepoFile(path)))
      .join("\n");

    assert.match(hook, /useEffect/);
    assert.match(effect, /session\.start\(/);
    assert.match(effect, /session\.stop\(/);
    assert.doesNotMatch(effect, /\.prompt\s*\(/);
    assert.doesNotMatch(effect, /\.install\s*\(/);
    assert.doesNotMatch(hook, /\.prompt\s*\(/);
    assert.match(card, /type="button"/);
    assert.match(card, /aria-busy=/);
    assert.match(card, /aria-hidden="true"/);
    assert.match(card, /role="status"/);
    assert.match(card, /aria-live="polite"/);
    assert.doesNotMatch(card, /role="alert"/);
    assert.equal(card.match(/<AppButton/g)?.length, 1);
    const installation = [
      "src/features/pwa/hooks/use-pwa-installation.ts",
      "src/features/pwa/lib/pwa-installation-session.ts",
      "src/features/pwa/lib/create-browser-pwa-installation-host.ts",
      "src/features/pwa/lib/get-pwa-install-card-model.ts",
      "src/features/pwa/components/pwa-install-card.tsx",
      "src/features/pwa/components/pwa-installation-provider.tsx",
    ]
      .map((path) => stripComments(readRepoFile(path)))
      .join("\n");

    assert.doesNotMatch(feature, /localStorage/);
    assert.doesNotMatch(feature, /sessionStorage/);
    assert.doesNotMatch(feature, /userAgent/);
    assert.doesNotMatch(feature, /skipWaiting/);
    assert.doesNotMatch(feature, /clientsClaim/);
    assert.doesNotMatch(installation, /navigator\.onLine/);
    assert.doesNotMatch(installation, /serviceWorker/);
  });

  test("does not add a second manifest or a PWA library", () => {
    assert.equal(existsSync(join(repoRoot, "src/sw.js")), false);
    assert.equal(existsSync(join(repoRoot, "public/manifest.json")), false);
    assert.equal(
      existsSync(join(repoRoot, "public/manifest.webmanifest")),
      false
    );

    const appSources = listSourceFiles("src")
      .filter((path) => !path.endsWith(".test.ts"))
      .map((path) => stripComments(readRepoFile(path)));
    for (const code of appSources) {
      assert.doesNotMatch(code, /from ["']workbox/);
      assert.doesNotMatch(code, /from ["']serwist/);
      assert.doesNotMatch(code, /from ["']next-pwa/);
    }
  });

  test("manifest still declares the install identity and icon files", () => {
    const document = manifest();

    assert.equal(document.name, "AsthmaTrack");
    assert.equal(document.short_name, "AsthmaTrack");
    assert.equal(document.start_url, "/");
    assert.equal(document.display, "standalone");
    assert.ok(document.display_override?.includes("standalone"));
    assert.equal(document.lang, "pt-BR");

    const icons = document.icons ?? [];
    const standard = icons.filter((icon) => icon.purpose === "any");
    const maskable = icons.filter((icon) => icon.purpose === "maskable");

    assert.deepEqual(
      standard.map((icon) => icon.sizes),
      ["192x192", "512x512"]
    );
    assert.deepEqual(
      maskable.map((icon) => icon.sizes),
      ["192x192", "512x512"]
    );
    for (const icon of icons) {
      assert.equal(icon.type, "image/png");
      assert.match(icon.src, /^\/icons\/.+\.png$/);
      assert.equal(
        existsSync(join(repoRoot, "public", icon.src.replace(/^\//, ""))),
        true
      );
    }

    assert.deepEqual(readPngSize("public/icons/icon-192x192.png"), {
      width: 192,
      height: 192,
    });
    assert.deepEqual(readPngSize("public/icons/icon-512x512.png"), {
      width: 512,
      height: 512,
    });
    assert.deepEqual(readPngSize("public/icons/icon-maskable-192x192.png"), {
      width: 192,
      height: 192,
    });
    assert.deepEqual(readPngSize("public/icons/icon-maskable-512x512.png"), {
      width: 512,
      height: 512,
    });
    assert.deepEqual(readPngSize("src/app/apple-icon.png"), {
      width: 180,
      height: 180,
    });
  });
});
