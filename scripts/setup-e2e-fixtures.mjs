import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { redactSecrets } from "./supabase-local.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const supabaseJs = path.join(
  repoRoot,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js"
);

const sqlPath = path.join(repoRoot, "scripts", "setup-e2e-fixtures.sql");

const PATIENT_A_EMAIL = "patient-a@fixtures.asthmatrack.test";
const PATIENT_B_EMAIL = "patient-b@fixtures.asthmatrack.test";
const MEDICAL_A_EMAIL = "medical-a@fixtures.asthmatrack.test";
const MEDICAL_B_EMAIL = "medical-b@fixtures.asthmatrack.test";
const PATIENT_A_ID = "e2ea0001-0000-4000-8000-0000000000a1";
const PATIENT_B_ID = "e2eb0002-0000-4000-8000-0000000000b2";
const PATIENT_A_RECORD_ID = "e2ea0011-0000-4000-8000-0000000000aa";
const PATIENT_B_RECORD_ID = "e2eb0012-0000-4000-8000-0000000000bb";
const PATIENT_A_PEF = "418";
const PATIENT_B_PEF = "527";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_PATTERN = /^[A-Z2-9]{8}$/;
const PASSWORD_PATTERN = /^[0-9a-f]{48}$/;

function fail(message) {
  const error = new Error(redactSecrets(message));
  error.name = "FixtureSetupError";
  throw error;
}

function isCi() {
  return process.env.CI === "true" || process.env.CI === "1";
}

function assertLoopback(urlString, label) {
  let parsed;

  try {
    parsed = new URL(urlString);
  } catch {
    fail(`${label} is not a valid URL. Refusing to continue.`);
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  const loopback =
    hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";

  if (!loopback) {
    fail(`${label} is not a loopback address. Refusing to continue.`);
  }

  return parsed;
}

function parseEnvText(text) {
  const entries = new Map();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");

    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries.set(key, value);
  }

  return entries;
}

function jwtRole(token) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function isPublicKey(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  if (value.startsWith("sb_secret_") || value.includes("service_role")) {
    return false;
  }

  if (value.startsWith("sb_publishable_")) {
    return true;
  }

  return jwtRole(value) === "anon";
}

function selectPublicKey(entries) {
  const publishable = entries.get("PUBLISHABLE_KEY") ?? "";
  const anon = entries.get("ANON_KEY") ?? "";

  if (isPublicKey(publishable)) {
    return publishable;
  }

  if (isPublicKey(anon)) {
    return anon;
  }

  fail("Local Supabase did not provide a public API key.");
}

function readProjectId() {
  const config = readFileSync(path.join(repoRoot, "supabase", "config.toml"), "utf8");
  const match = config.match(/^project_id\s*=\s*"([^"]+)"/m);

  if (!match) {
    fail("supabase/config.toml is missing project_id.");
  }

  const sanitized = match[1]
    .replace(/[^a-zA-Z0-9_.-]+/g, "_")
    .replace(/^[_.-]+/, "")
    .slice(0, 40);

  if (!/^[A-Za-z0-9_.-]+$/.test(sanitized)) {
    fail("supabase project_id is not safe to use as a container name.");
  }

  return sanitized;
}

function resolveOutputPath(argv) {
  let requested = ".env.e2e.local";

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument !== "--output") {
      fail(
        "Unknown argument. Usage: node scripts/setup-e2e-fixtures.mjs [--output .env.e2e.local]"
      );
    }

    const value = argv[index + 1];

    if (!value || value.startsWith("-")) {
      fail("Missing path after --output.");
    }

    requested = value;
    index += 1;
  }

  const resolved = path.resolve(repoRoot, requested);

  if (path.dirname(resolved).toLowerCase() !== repoRoot.toLowerCase()) {
    fail("E2E environment output must stay in the repository root.");
  }

  const base = path.basename(resolved);

  if (base !== ".env.e2e.local" && base !== ".env.e2e.ci") {
    fail("E2E environment output name is not allowed.");
  }

  return resolved;
}

function quoteEnv(value) {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")}"`;
}

function requireField(payload, key) {
  const value = payload[key];

  if (typeof value !== "string" && typeof value !== "number") {
    fail("Fixture result is missing a required field.");
  }

  return String(value);
}

function validatePayload(payload) {
  const patientAEmail = requireField(payload, "patient_a_email");
  const patientBEmail = requireField(payload, "patient_b_email");
  const medicalAEmail = requireField(payload, "medical_a_email");
  const medicalBEmail = requireField(payload, "medical_b_email");
  const patientAPassword = requireField(payload, "patient_a_password");
  const patientBPassword = requireField(payload, "patient_b_password");
  const medicalAPassword = requireField(payload, "medical_a_password");
  const medicalBPassword = requireField(payload, "medical_b_password");
  const patientAId = requireField(payload, "patient_a_id");
  const patientBId = requireField(payload, "patient_b_id");
  const patientARecordId = requireField(payload, "patient_a_record_id");
  const patientBRecordId = requireField(payload, "patient_b_record_id");
  const patientAPef = requireField(payload, "patient_a_pef");
  const patientBPef = requireField(payload, "patient_b_pef");
  const medicalACode = requireField(payload, "medical_a_code");
  const medicalBCode = requireField(payload, "medical_b_code");

  const emailsMatch =
    patientAEmail === PATIENT_A_EMAIL &&
    patientBEmail === PATIENT_B_EMAIL &&
    medicalAEmail === MEDICAL_A_EMAIL &&
    medicalBEmail === MEDICAL_B_EMAIL;
  const idsMatch =
    patientAId === PATIENT_A_ID &&
    patientBId === PATIENT_B_ID &&
    patientARecordId === PATIENT_A_RECORD_ID &&
    patientBRecordId === PATIENT_B_RECORD_ID &&
    UUID_PATTERN.test(patientAId) &&
    UUID_PATTERN.test(patientBId) &&
    UUID_PATTERN.test(patientARecordId) &&
    UUID_PATTERN.test(patientBRecordId);
  const passwordsMatch = [
    patientAPassword,
    patientBPassword,
    medicalAPassword,
    medicalBPassword,
  ].every((password) => PASSWORD_PATTERN.test(password));
  const distinctPasswords = new Set([
    patientAPassword,
    patientBPassword,
    medicalAPassword,
    medicalBPassword,
  ]).size === 4;
  const codesMatch =
    CODE_PATTERN.test(medicalACode) &&
    CODE_PATTERN.test(medicalBCode) &&
    medicalACode !== medicalBCode;
  const pefsMatch = patientAPef === PATIENT_A_PEF && patientBPef === PATIENT_B_PEF;

  if (
    !emailsMatch ||
    !idsMatch ||
    !passwordsMatch ||
    !distinctPasswords ||
    !codesMatch ||
    !pefsMatch
  ) {
    fail("Fixture result failed validation.");
  }

  return {
    patientAEmail,
    patientAPassword,
    patientBEmail,
    patientBPassword,
    medicalAEmail,
    medicalAPassword,
    medicalBEmail,
    medicalBPassword,
    patientAId,
    patientBId,
    patientARecordId,
    patientBRecordId,
    patientAPef,
    patientBPef,
    medicalACode,
    medicalBCode,
  };
}

function readFixturePayload(stdout) {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{"));

  if (lines.length !== 1) {
    fail("Fixture setup did not return a result.");
  }

  try {
    const parsed = JSON.parse(lines[0]);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      fail("Fixture setup did not return a result.");
    }

    return parsed;
  } catch {
    fail("Fixture setup did not return a result.");
  }
}

function printFixtureFailure(stderr) {
  const redacted = redactSecrets(stderr)
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "[uuid]"
    )
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .trim();

  if (redacted.length > 0) {
    process.stderr.write(`${redacted}\n`);
    return;
  }

  process.stderr.write("Fixture setup failed.\n");
}

function localStatus() {
  const result = spawnSync(
    process.execPath,
    [supabaseJs, "status", "-o", "env"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      windowsHide: true,
    }
  );

  if (result.status !== 0) {
    fail("Local Supabase is not running.");
  }

  return parseEnvText(result.stdout ?? "");
}

function runFixtureSql(containerName) {
  const inspect = spawnSync(
    "docker",
    ["inspect", "-f", "{{.State.Running}}", containerName],
    {
      cwd: repoRoot,
      encoding: "utf8",
      windowsHide: true,
    }
  );

  if (inspect.error || (inspect.stdout ?? "").trim() !== "true") {
    fail("Local Supabase database container is not running.");
  }

  const sql = readFileSync(sqlPath);
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      containerName,
      "psql",
      "-X",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
      "-At",
      "-P",
      "pager=off",
    ],
    {
      cwd: repoRoot,
      input: sql,
      encoding: "utf8",
      windowsHide: true,
    }
  );

  if (result.error || result.status !== 0) {
    printFixtureFailure(
      `${result.stderr ?? ""}\n${result.error instanceof Error ? result.error.message : ""}`
    );
    process.exit(result.status ?? 1);
  }

  return readFixturePayload(result.stdout ?? "");
}

function writeEnvironment(outputPath, apiUrl, publicKey, fixture) {
  const contents = [
    "# Generated for local Supabase only. Gitignored. Do not commit.",
    `NEXT_PUBLIC_SUPABASE_URL=${quoteEnv(apiUrl)}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${quoteEnv(publicKey)}`,
    `E2E_PATIENT_A_EMAIL=${quoteEnv(fixture.patientAEmail)}`,
    `E2E_PATIENT_A_PASSWORD=${quoteEnv(fixture.patientAPassword)}`,
    `E2E_PATIENT_B_EMAIL=${quoteEnv(fixture.patientBEmail)}`,
    `E2E_PATIENT_B_PASSWORD=${quoteEnv(fixture.patientBPassword)}`,
    `E2E_MEDICAL_A_EMAIL=${quoteEnv(fixture.medicalAEmail)}`,
    `E2E_MEDICAL_A_PASSWORD=${quoteEnv(fixture.medicalAPassword)}`,
    `E2E_MEDICAL_B_EMAIL=${quoteEnv(fixture.medicalBEmail)}`,
    `E2E_MEDICAL_B_PASSWORD=${quoteEnv(fixture.medicalBPassword)}`,
    `E2E_PATIENT_A_PEF=${quoteEnv(fixture.patientAPef)}`,
    `E2E_PATIENT_B_PEF=${quoteEnv(fixture.patientBPef)}`,
    `E2E_PATIENT_A_ID=${quoteEnv(fixture.patientAId)}`,
    `E2E_PATIENT_B_ID=${quoteEnv(fixture.patientBId)}`,
    `E2E_PATIENT_A_RECORD_ID=${quoteEnv(fixture.patientARecordId)}`,
    `E2E_PATIENT_B_RECORD_ID=${quoteEnv(fixture.patientBRecordId)}`,
    `E2E_MEDICAL_A_PROFESSIONAL_CODE=${quoteEnv(fixture.medicalACode)}`,
    `E2E_MEDICAL_B_PROFESSIONAL_CODE=${quoteEnv(fixture.medicalBCode)}`,
    "",
  ].join("\n");

  const partialPath = `${outputPath}.partial`;

  try {
    writeFileSync(partialPath, contents, { encoding: "utf8", mode: 0o600 });
    renameSync(partialPath, outputPath);
  } catch (error) {
    if (existsSync(partialPath)) {
      unlinkSync(partialPath);
    }

    const message = error instanceof Error ? error.message : "write failed";
    fail(`Could not write the E2E environment file (${redactSecrets(message)}).`);
  }
}

function main() {
  try {
    run();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Fixture setup failed.";
    process.stderr.write(`${redactSecrets(message)}\n`);
    process.exit(1);
  }
}

function run() {
  const outputPath = resolveOutputPath(process.argv.slice(2));

  if (existsSync(outputPath) && !isCi()) {
    fail(
      "Refusing to replace an existing E2E environment file outside CI."
    );
  }

  const status = localStatus();
  const apiUrl = status.get("API_URL") ?? "";
  const databaseUrl = status.get("DB_URL") ?? "";

  assertLoopback(apiUrl, "NEXT_PUBLIC_SUPABASE_URL");
  assertLoopback(databaseUrl, "Local database URL");

  const publicKey = selectPublicKey(status);
  const containerName = `supabase_db_${readProjectId()}`;
  const fixture = validatePayload(runFixtureSql(containerName));

  writeEnvironment(outputPath, apiUrl, publicKey, fixture);
  process.stdout.write("Local E2E fixtures are ready.\n");
}

main();
