/**
 * AsthmaTrack service worker (cache version v1).
 *
 * Stores only the public offline page and same-origin public static assets.
 * Authenticated documents, health data, Supabase, and auth responses stay on
 * the network and are never written to Cache Storage.
 *
 * Caches:
 * - asthmatrack-offline-v1
 * - asthmatrack-static-v1
 *
 * Local check: npm run build && npm run start, then open http://localhost:3000.
 * next dev does not register this worker. If a previous localhost worker is
 * still controlling the page, unregister it in DevTools:
 * Application → Service Workers → Unregister.
 * Then delete only Cache Storage names that start with "asthmatrack-".
 * Do not delete unrelated origin caches.
 *
 * The first install activates on its own. Later updates wait until open pages
 * close. This file does not call skipWaiting or clients.claim. Issue 120 can
 * watch registration.waiting and updatefound, then activate an update by
 * posting { type: "SKIP_WAITING" } after it adds that listener.
 */

const CACHE_VERSION = "v1";
const CACHE_PREFIX = "asthmatrack-";
const STATIC_CACHE = `asthmatrack-static-${CACHE_VERSION}`;
const OFFLINE_CACHE = `asthmatrack-offline-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_ASSETS = [
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
];

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".woff2",
  ".woff",
  ".ttf",
  ".otf",
  ".png",
  ".svg",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
];

const EMERGENCY_OFFLINE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sem conexão</title>
</head>
<body>
  <h1>Sem conexão</h1>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(precachePublicShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteObsoleteCaches());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.headers.has("range") || request.headers.has("authorization")) {
    return;
  }

  let url;

  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  if (isRouterDataRequest(request, url) || isDownloadPath(url.pathname)) {
    return;
  }

  if (isAuthPath(url.pathname)) {
    return;
  }

  if (isDocumentNavigation(request)) {
    event.respondWith(respondToNavigation(request));
    return;
  }

  if (url.search !== "" || isPrivatePath(url.pathname)) {
    return;
  }

  if (!isRuntimeStaticPath(url.pathname)) {
    return;
  }

  event.respondWith(respondToStatic(url.pathname, request));
});

async function precachePublicShell() {
  const offlineResponse = await fetchPublic(OFFLINE_URL);

  if (!isPrecacheResponse(OFFLINE_URL, offlineResponse)) {
    throw new Error("AsthmaTrack offline page could not be cached.");
  }

  const offlineCache = await caches.open(OFFLINE_CACHE);
  await offlineCache.put(OFFLINE_URL, offlineResponse);

  const staticCache = await caches.open(STATIC_CACHE);

  for (const path of PRECACHE_ASSETS) {
    const response = await fetchPublic(path);

    if (!isPrecacheResponse(path, response)) {
      throw new Error("AsthmaTrack public asset could not be cached.");
    }

    await staticCache.put(path, response);
  }
}

async function deleteObsoleteCaches() {
  const keys = await caches.keys();

  await Promise.all(
    keys.map((key) => {
      const isCurrent = key === STATIC_CACHE || key === OFFLINE_CACHE;

      if (key.startsWith(CACHE_PREFIX) && !isCurrent) {
        return caches.delete(key);
      }

      return Promise.resolve(false);
    })
  );
}

async function respondToNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(OFFLINE_CACHE);
    const cached = await cache.match(OFFLINE_URL);

    if (cached) {
      return cached;
    }

    return createEmergencyOfflineResponse();
  }
}

async function respondToStatic(pathname, request) {
  const cache = await caches.open(STATIC_CACHE);
  const cacheKey = new Request(new URL(pathname, self.location.origin).href, {
    method: "GET",
    credentials: "omit",
  });
  const cached = await cache.match(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (isCacheableStaticResponse(response)) {
    await cache.put(cacheKey, response.clone());
  }

  return response;
}

function fetchPublic(path) {
  return fetch(
    new Request(new URL(path, self.location.origin).href, {
      method: "GET",
      credentials: "omit",
      cache: "reload",
      redirect: "manual",
    })
  );
}

function isDocumentNavigation(request) {
  return request.mode === "navigate" || request.destination === "document";
}

function isRouterDataRequest(request, url) {
  if (url.searchParams.has("_rsc")) {
    return true;
  }

  const accept = request.headers.get("accept") || "";

  return (
    request.headers.has("rsc") ||
    request.headers.has("next-router-prefetch") ||
    request.headers.has("next-router-segment-prefetch") ||
    request.headers.has("next-router-state-tree") ||
    request.headers.has("next-action") ||
    request.headers.has("next-hmr-refresh") ||
    accept.includes("text/x-component")
  );
}

function isDownloadPath(pathname) {
  return pathname.endsWith(".pdf") || pathname.includes("/pdf");
}

function isAuthPath(pathname) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

function isPrivatePath(pathname) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/cadastro" ||
    pathname.startsWith("/cadastro/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/recuperar-senha" ||
    pathname.startsWith("/recuperar-senha/") ||
    pathname === "/redefinir-senha" ||
    pathname.startsWith("/redefinir-senha/") ||
    pathname === "/paciente" ||
    pathname.startsWith("/paciente/") ||
    pathname === "/equipe-medica" ||
    pathname.startsWith("/equipe-medica/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  );
}

function isRuntimeStaticPath(pathname) {
  if (PRECACHE_ASSETS.includes(pathname)) {
    return true;
  }

  if (!pathname.startsWith("/_next/static/") || pathname.includes("..")) {
    return false;
  }

  return STATIC_EXTENSIONS.some((extension) => pathname.endsWith(extension));
}

function isPrecacheResponse(path, response) {
  if (!isStorableResponse(response)) {
    return false;
  }

  const contentType = contentTypeOf(response);

  if (path === OFFLINE_URL) {
    return contentType.includes("text/html");
  }

  if (path === "/manifest.webmanifest") {
    return contentType.includes("manifest") || contentType.includes("json");
  }

  return contentType.startsWith("image/");
}

function isCacheableStaticResponse(response) {
  if (!isStorableResponse(response)) {
    return false;
  }

  const contentType = contentTypeOf(response);

  return (
    !contentType.includes("text/html") &&
    !contentType.includes("text/x-component") &&
    !contentType.includes("application/json") &&
    !contentType.includes("application/pdf")
  );
}

function isStorableResponse(response) {
  if (!response || response.status !== 200 || response.redirected) {
    return false;
  }

  if (response.type !== "basic" && response.type !== "default") {
    return false;
  }

  if (response.headers.has("set-cookie")) {
    return false;
  }

  const cacheControl = (
    response.headers.get("cache-control") || ""
  ).toLowerCase();

  if (cacheControl.includes("no-store") || cacheControl.includes("private")) {
    return false;
  }

  const disposition = (
    response.headers.get("content-disposition") || ""
  ).toLowerCase();

  return !disposition.includes("attachment");
}

function contentTypeOf(response) {
  return (response.headers.get("content-type") || "").toLowerCase();
}

function createEmergencyOfflineResponse() {
  return new Response(EMERGENCY_OFFLINE_HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
