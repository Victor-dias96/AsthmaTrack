// This file stays CommonJS because playwright.config.ts and run-e2e-server.mjs
// both load it by its .cjs path. Only Node built-ins are required here.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { existsSync, readFileSync } = require("node:fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const e2eEnvPath = path.join(repoRoot, ".env.e2e.local");

const REQUIRED_PUBLIC_E2E_VARIABLES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

const SERVICE_ROLE_KEY = /service[_-]?role/i;

function isServiceRoleKey(key) {
  return SERVICE_ROLE_KEY.test(key);
}

function parseEnvValue(raw) {
  const trimmed = raw.trim();

  if (trimmed.startsWith('"')) {
    let value = "";

    for (let index = 1; index < trimmed.length; index += 1) {
      const character = trimmed[index];

      if (character === "\\") {
        const next = trimmed[index + 1] ?? "";
        if (next === "n") value += "\n";
        else if (next === "r") value += "\r";
        else if (next === '"') value += '"';
        else if (next === "\\") value += "\\";
        else value += next;
        index += 1;
        continue;
      }

      if (character === '"') {
        return value;
      }

      value += character;
    }

    throw new Error("Invalid quoted value in .env.e2e.local.");
  }

  if (trimmed.startsWith("'")) {
    const closingQuote = trimmed.indexOf("'", 1);

    if (closingQuote === -1) {
      throw new Error("Invalid quoted value in .env.e2e.local.");
    }

    return trimmed.slice(1, closingQuote);
  }

  const commentIndex = trimmed.search(/\s#/);
  const unquoted =
    commentIndex === -1 ? trimmed : trimmed.slice(0, commentIndex);

  return unquoted.trim();
}

function parseEnvFile(contents) {
  const entries = new Map();

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const normalized = line.startsWith("export ")
      ? line.slice("export ".length).trim()
      : line;
    const separator = normalized.indexOf("=");

    if (separator <= 0) {
      throw new Error("Invalid line in .env.e2e.local.");
    }

    const key = normalized.slice(0, separator).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error("Invalid variable name in .env.e2e.local.");
    }

    entries.set(key, parseEnvValue(normalized.slice(separator + 1)));
  }

  return entries;
}

function assertLoopbackSupabaseUrl(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Refusing to start the E2E server."
    );
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  const loopback =
    hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";

  if (!loopback) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a loopback address. Refusing to start the E2E server."
    );
  }
}

/**
 * Reads only `.env.e2e.local` and applies it over the current process
 * environment. Next.js gives existing `process.env` values priority over
 * `.env.local`, so the dev server inherits local Supabase settings.
 */
function applyE2eEnvironment() {
  if (!existsSync(e2eEnvPath)) {
    throw new Error("Missing .env.e2e.local. Refusing to start the E2E server.");
  }

  const parsed = parseEnvFile(
    readFileSync(e2eEnvPath, "utf8").replace(/^\uFEFF/, "")
  );
  const missing = REQUIRED_PUBLIC_E2E_VARIABLES.filter((name) => {
    const value = parsed.get(name);
    return value === undefined || value.length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required public E2E variable: ${missing.join(", ")}. Refusing to start the E2E server.`
    );
  }

  assertLoopbackSupabaseUrl(parsed.get("NEXT_PUBLIC_SUPABASE_URL"));

  for (const key of Object.keys(process.env)) {
    if (isServiceRoleKey(key)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of parsed) {
    if (isServiceRoleKey(key)) {
      continue;
    }

    process.env[key] = value;
  }
}

function childEnvironment() {
  const env = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value !== "string" || isServiceRoleKey(key)) {
      continue;
    }

    env[key] = value;
  }

  return env;
}

module.exports = {
  applyE2eEnvironment,
  childEnvironment,
};
