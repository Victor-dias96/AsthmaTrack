import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const PRIVATE_ROUTES = [
  "/paciente/dashboard",
  "/paciente/historico",
  "/paciente/relatorio",
  "/paciente/relatorio/pdf",
  "/paciente/configuracoes",
  "/paciente/configuracoes/acessos",
  "/equipe-medica",
  "/equipe-medica/pacientes",
  "/login",
  "/cadastro",
  "/onboarding",
  "/auth/callback",
];

type FetchEventResult = {
  responded: boolean;
  response: Response | null;
};

type WorkerHarness = {
  install: () => Promise<void>;
  activate: () => Promise<void>;
  fetch: (request: FakeRequest) => Promise<FetchEventResult>;
  cachedKeys: () => string[];
  cacheNames: () => string[];
  stores: Map<string, Map<string, Response>>;
};

type FakeRequest = {
  url: string;
  method: string;
  mode: string;
  destination: string;
  headers: {
    has: (name: string) => boolean;
    get: (name: string) => string | null;
  };
};

function createMemoryCaches() {
  const stores = new Map<string, Map<string, Response>>();

  return {
    stores,
    caches: {
      async open(name: string) {
        const store = stores.get(name) ?? new Map<string, Response>();
        stores.set(name, store);

        return {
          async put(request: Request | string, response: Response) {
            stores.get(name)?.set(cachePath(request), response.clone());
          },
          async match(request: Request | string) {
            const stored = stores.get(name)?.get(cachePath(request));
            return stored ? stored.clone() : undefined;
          },
        };
      },
      async keys() {
        return [...stores.keys()];
      },
      async delete(name: string) {
        return stores.delete(name);
      },
    },
  };
}

function cachePath(request: Request | string): string {
  const value = typeof request === "string" ? request : request.url;
  return new URL(value, "http://localhost:3000").pathname;
}

function loadWorker(
  fetchImpl: (input: Request | string) => Promise<Response>
): WorkerHarness {
  const memory = createMemoryCaches();
  const listeners = new Map<string, (event: unknown) => void>();
  const scope = {
    location: { origin: "http://localhost:3000" },
    addEventListener(type: string, listener: (event: unknown) => void) {
      listeners.set(type, listener);
    },
  };

  runInNewContext(readRepoFile("public/sw.js"), {
    self: scope,
    caches: memory.caches,
    fetch: fetchImpl,
    Response,
    Request,
    URL,
    Headers,
    console,
  });

  return {
    async install() {
      await waitFor(listeners.get("install"));
    },
    async activate() {
      await waitFor(listeners.get("activate"));
    },
    async fetch(request) {
      let responded = false;
      let responsePromise: Promise<Response> | null = null;
      listeners.get("fetch")?.({
        request,
        respondWith(value: Promise<Response>) {
          responded = true;
          responsePromise = value;
        },
      });

      return {
        responded,
        response: responded && responsePromise ? await responsePromise : null,
      };
    },
    cachedKeys() {
      return [...memory.stores.values()].flatMap((store) => [...store.keys()]);
    },
    cacheNames() {
      return [...memory.stores.keys()];
    },
    stores: memory.stores,
  };
}

async function waitFor(
  listener: ((event: unknown) => void) | undefined
): Promise<void> {
  assert.ok(listener);
  let task: Promise<unknown> = Promise.resolve();
  listener({
    waitUntil(promise: Promise<unknown>) {
      task = promise;
    },
  });
  await task;
}

function fakeRequest(input: {
  path: string;
  method?: string;
  mode?: string;
  destination?: string;
  headers?: Record<string, string>;
  origin?: string;
}): FakeRequest {
  const headers = new Map(
    Object.entries(input.headers ?? {}).map(([name, value]) => [
      name.toLowerCase(),
      value,
    ])
  );

  return {
    url: `${input.origin ?? "http://localhost:3000"}${input.path}`,
    method: input.method ?? "GET",
    mode: input.mode ?? "cors",
    destination: input.destination ?? "",
    headers: {
      has: (name) => headers.has(name.toLowerCase()),
      get: (name) => headers.get(name.toLowerCase()) ?? null,
    },
  };
}

function publicResponse(path: string, init?: ResponseInit): Response {
  if (path === "/offline") {
    return new Response("<html><body><h1>Sem conexão</h1></body></html>", {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (path === "/manifest.webmanifest") {
    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/manifest+json" },
    });
  }

  if (path.endsWith(".js")) {
    return new Response("console.log('static');", {
      status: 200,
      headers: {
        "Content-Type": "text/javascript",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...headersFrom(init),
      },
    });
  }

  return new Response("image", {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "image/png",
      ...headersFrom(init),
    },
  });
}

function headersFrom(init?: ResponseInit): Record<string, string> {
  if (!init?.headers) {
    return {};
  }

  return Object.fromEntries(new Headers(init.headers).entries());
}

function createFetch(overrides?: {
  failPaths?: string[];
  responses?: Record<string, Response>;
}) {
  const calls: string[] = [];

  const fetchImpl = async (input: Request | string) => {
    const path = cachePath(input);
    calls.push(path);

    if (overrides?.failPaths?.includes(path)) {
      throw new Error("network down");
    }

    if (overrides?.responses?.[path]) {
      return overrides.responses[path].clone();
    }

    return publicResponse(path);
  };

  return { fetchImpl, calls };
}

describe("service worker boundaries", () => {
  test("keeps a single production registration on the root client boundary", () => {
    assert.equal(existsSync(join(repoRoot, "public/sw.js")), true);
    assert.equal(existsSync(join(repoRoot, "public/service-worker.js")), false);
    assert.equal(existsSync(join(repoRoot, "src/sw.js")), false);

    const registration = readRepoFile(
      "src/features/pwa/components/service-worker-registration.tsx"
    );
    const root = readRepoFile(
      "src/features/pwa/components/pwa-client-features.tsx"
    );
    const layout = readRepoFile("src/app/layout.tsx");
    const helper = readRepoFile(
      "src/features/pwa/lib/register-service-worker.ts"
    );
    const sources = [
      "src/app/layout.tsx",
      "src/app/paciente/layout.tsx",
      "src/app/equipe-medica/layout.tsx",
      "src/features/pwa/components/pwa-client-features.tsx",
      "src/features/pwa/components/pwa-installation-provider.tsx",
      "src/features/pwa/components/service-worker-registration.tsx",
    ].map(readRepoFile);

    assert.match(layout, /<PwaClientFeatures>/);
    assert.equal(layout.match(/<PwaClientFeatures>/g)?.length, 1);
    assert.doesNotMatch(layout, /["']use client["']/);
    assert.match(root, /<ServiceWorkerRegistration \/>/);
    assert.equal(root.match(/<ServiceWorkerRegistration \/>/g)?.length, 1);
    assert.match(root, /<PwaInstallationProvider>/);
    assert.match(registration, /startServiceWorkerRegistration/);
    assert.match(registration, /NODE_ENV === "production"/);
    assert.match(registration, /return null/);
    assert.match(helper, /register\("\/sw\.js", \{ scope: "\/" \}\)/);
    assert.equal(
      sources.join("\n").match(/serviceWorker\.register/g)?.length ?? 0,
      0
    );
    assert.equal(helper.match(/\.register\(/g)?.length, 1);
    assert.doesNotMatch(
      registration,
      /Nova versão|navigator\.onLine|skipWaiting/
    );
    assert.doesNotMatch(
      readRepoFile("package.json"),
      /workbox|serwist|next-pwa/
    );
  });

  test("precaches only the offline page and public branding", () => {
    const worker = stripComments(readRepoFile("public/sw.js"));
    const assets = worker.match(/const PRECACHE_ASSETS = \[([\s\S]*?)\];/)?.[1];

    assert.ok(assets);
    assert.match(worker, /const CACHE_VERSION = "v1"/);
    assert.match(worker, /asthmatrack-static-\$\{CACHE_VERSION\}/);
    assert.match(worker, /asthmatrack-offline-\$\{CACHE_VERSION\}/);
    assert.match(worker, /const OFFLINE_URL = "\/offline"/);
    assert.match(assets, /\/manifest\.webmanifest/);
    assert.match(assets, /\/favicon\.ico/);
    assert.match(assets, /\/icon\.png/);
    assert.match(assets, /\/apple-icon\.png/);
    assert.match(assets, /\/icons\/icon-192x192\.png/);
    assert.match(assets, /\/icons\/icon-512x512\.png/);
    assert.match(assets, /\/icons\/icon-maskable-192x192\.png/);
    assert.match(assets, /\/icons\/icon-maskable-512x512\.png/);
    assert.doesNotMatch(worker, /Date\.now|importScripts|indexedDB|supabase/);
    assert.doesNotMatch(worker, /skipWaiting\s*\(|clients\.claim\s*\(/);
    assert.doesNotMatch(
      worker,
      /background sync|sync\.register|navigator\.onLine/i
    );

    for (const route of PRIVATE_ROUTES) {
      assert.equal(assets.includes(route), false, route);
    }
  });

  test("serves /sw.js with revalidation and without the auth proxy", () => {
    const config = readRepoFile("next.config.ts");
    const proxy = readRepoFile("src/proxy.ts");

    assert.match(config, /source: "\/sw\.js"/);
    assert.match(config, /public, max-age=0, must-revalidate/);
    assert.equal(proxy.includes("manifest\\\\.webmanifest|sw\\\\.js"), true);
    assert.doesNotMatch(
      readRepoFile("src/app/manifest.ts"),
      /start_url: "\/offline"/
    );
  });
});

describe("service worker fetch handling", () => {
  test("installs the public allowlist and ignores private urls", async () => {
    const { fetchImpl, calls } = createFetch();
    const worker = loadWorker(fetchImpl);

    await worker.install();

    assert.deepEqual(calls.sort(), [
      "/apple-icon.png",
      "/favicon.ico",
      "/icon.png",
      "/icons/icon-192x192.png",
      "/icons/icon-512x512.png",
      "/icons/icon-maskable-192x192.png",
      "/icons/icon-maskable-512x512.png",
      "/manifest.webmanifest",
      "/offline",
    ]);
    assert.equal(
      calls.some((path) => path.startsWith("/paciente")),
      false
    );
    assert.ok(worker.cachedKeys().includes("/offline"));
  });

  test("returns cached /offline only when a navigation fetch throws", async () => {
    const { fetchImpl } = createFetch({
      failPaths: ["/paciente/dashboard", "/equipe-medica"],
    });
    const worker = loadWorker(fetchImpl);
    await worker.install();

    const offline = await worker.fetch(
      fakeRequest({
        path: "/paciente/dashboard",
        mode: "navigate",
        destination: "document",
      })
    );
    const text = await offline.response?.text();

    assert.equal(offline.responded, true);
    assert.match(text ?? "", /Sem conexão/);
    assert.equal(worker.cachedKeys().includes("/paciente/dashboard"), false);
  });

  test("does not cache a successful protected navigation", async () => {
    const { fetchImpl } = createFetch({
      responses: {
        "/paciente/dashboard": new Response("<html>private</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
        "/login": new Response("<html>login</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      },
    });
    const worker = loadWorker(fetchImpl);
    await worker.install();

    const dashboard = await worker.fetch(
      fakeRequest({ path: "/paciente/dashboard", mode: "navigate" })
    );
    const login = await worker.fetch(
      fakeRequest({ path: "/login", mode: "navigate" })
    );

    assert.equal(await dashboard.response?.text(), "<html>private</html>");
    assert.equal(await login.response?.text(), "<html>login</html>");
    assert.equal(worker.cachedKeys().includes("/paciente/dashboard"), false);
    assert.equal(worker.cachedKeys().includes("/login"), false);
  });

  test("preserves 401, 403, and 500 navigation responses", async () => {
    const statuses = [401, 403, 500];

    for (const status of statuses) {
      const { fetchImpl } = createFetch({
        responses: {
          "/paciente/historico": new Response(`status-${status}`, { status }),
        },
      });
      const worker = loadWorker(fetchImpl);
      await worker.install();
      const result = await worker.fetch(
        fakeRequest({ path: "/paciente/historico", mode: "navigate" })
      );

      assert.equal(result.response?.status, status);
      assert.equal(await result.response?.text(), `status-${status}`);
    }
  });

  test("reads a versioned static asset from cache", async () => {
    const { fetchImpl, calls } = createFetch();
    const worker = loadWorker(fetchImpl);
    await worker.install();
    const path = "/_next/static/chunks/app.js";

    const first = await worker.fetch(
      fakeRequest({ path, destination: "script" })
    );
    const second = await worker.fetch(
      fakeRequest({ path, destination: "script" })
    );

    assert.equal(await first.response?.text(), "console.log('static');");
    assert.equal(await second.response?.text(), "console.log('static');");
    assert.equal(calls.filter((call) => call === path).length, 1);
    assert.ok(worker.cachedKeys().includes(path));
  });

  test("does not store private, cookie, or non-static responses", async () => {
    const { fetchImpl } = createFetch({
      responses: {
        "/_next/static/chunks/private.js": new Response("secret", {
          status: 200,
          headers: {
            "Content-Type": "text/javascript",
            "Cache-Control": "private, no-store",
          },
        }),
        "/_next/static/chunks/cookie.js": new Response("cookie", {
          status: 200,
          headers: {
            "Content-Type": "text/javascript",
            "Set-Cookie": "session=secret",
          },
        }),
      },
    });
    const worker = loadWorker(fetchImpl);

    await worker.fetch(
      fakeRequest({ path: "/_next/static/chunks/private.js" })
    );
    await worker.fetch(fakeRequest({ path: "/_next/static/chunks/cookie.js" }));
    await worker.fetch(
      fakeRequest({
        path: "/_next/static/chunks/app.js",
        headers: { RSC: "1" },
      })
    );
    await worker.fetch(
      fakeRequest({ path: "/_next/static/chunks/app.js?_rsc=1" })
    );

    assert.equal(
      worker.cachedKeys().includes("/_next/static/chunks/private.js"),
      false
    );
    assert.equal(
      worker.cachedKeys().includes("/_next/static/chunks/cookie.js"),
      false
    );
    assert.equal(
      worker.cachedKeys().includes("/_next/static/chunks/app.js"),
      false
    );
  });

  test("passes cross-origin, mutation, auth, and pdf requests through", async () => {
    const { fetchImpl, calls } = createFetch();
    const worker = loadWorker(fetchImpl);
    const ignored = [
      fakeRequest({
        path: "/rest/v1/daily_records",
        origin: "https://project.supabase.co",
      }),
      fakeRequest({ path: "/paciente/novo-registro", method: "POST" }),
      fakeRequest({ path: "/paciente/historico/1", method: "PATCH" }),
      fakeRequest({ path: "/paciente/historico/1", method: "DELETE" }),
      fakeRequest({ path: "/auth/callback", mode: "navigate" }),
      fakeRequest({ path: "/paciente/relatorio/pdf", mode: "navigate" }),
      fakeRequest({
        path: "/login",
        mode: "navigate",
        headers: { authorization: "Bearer secret" },
      }),
    ];

    for (const request of ignored) {
      const result = await worker.fetch(request);
      assert.equal(result.responded, false);
    }

    assert.deepEqual(calls, []);
  });

  test("uses the emergency document only when /offline is missing", async () => {
    const { fetchImpl } = createFetch({ failPaths: ["/cadastro"] });
    const worker = loadWorker(fetchImpl);
    const result = await worker.fetch(
      fakeRequest({ path: "/cadastro", mode: "navigate" })
    );
    const html = await result.response?.text();

    assert.match(html ?? "", /<h1>Sem conexão<\/h1>/);
    assert.doesNotMatch(html ?? "", /<script|paciente|equipe-medica/i);
  });

  test("deletes obsolete AsthmaTrack caches and keeps unrelated ones", async () => {
    const { fetchImpl } = createFetch();
    const worker = loadWorker(fetchImpl);

    worker.stores.set("asthmatrack-static-v0", new Map());
    worker.stores.set("asthmatrack-offline-v0", new Map());
    worker.stores.set("unrelated-cache", new Map());
    await worker.install();
    await worker.activate();

    assert.deepEqual(worker.cacheNames().sort(), [
      "asthmatrack-offline-v1",
      "asthmatrack-static-v1",
      "unrelated-cache",
    ]);
  });
});
