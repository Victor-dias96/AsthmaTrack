import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const SECRET_TEXT =
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]+|postgres(?:ql)?:\/\/\S+|\$2[aby]\$\d{2}\$[./A-Za-z0-9]+/g;

/**
 * @param {string} text
 */
export function redactSecrets(text) {
  return text.replace(SECRET_TEXT, "[redacted]");
}

/**
 * @param {string} chunk
 * @param {NodeJS.WriteStream} stream
 */
function writeRedacted(chunk, stream) {
  stream.write(redactSecrets(chunk));
}

function isCi() {
  return process.env.CI === "true" || process.env.CI === "1";
}

/**
 * @param {string[]} args
 * @returns {Promise<number>}
 */
function runSupabase(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [supabaseJs, ...args], {
      cwd: repoRoot,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      writeRedacted(chunk, process.stdout);
    });
    child.stderr.on("data", (chunk) => {
      writeRedacted(chunk, process.stderr);
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function main() {
  const command = process.argv[2];

  if (command === "start") {
    const code = await runSupabase(["start", "--yes"]);
    if (code !== 0) {
      process.exit(code);
    }

    process.stdout.write("Local Supabase is running.\n");
    return;
  }

  if (command === "stop") {
    if (!isCi()) {
      process.stderr.write(
        "Refusing to stop local Supabase outside CI. This avoids deleting local volumes.\n"
      );
      process.exit(1);
    }

    const code = await runSupabase(["stop", "--yes", "--no-backup"]);
    process.exit(code);
  }

  process.stderr.write("Usage: node scripts/supabase-local.mjs <start|stop>\n");
  process.exit(1);
}

const entry = process.argv[1];

if (
  entry &&
  path.resolve(entry).toLowerCase() ===
    path.resolve(fileURLToPath(import.meta.url)).toLowerCase()
) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : "Supabase command failed.";
    process.stderr.write(`${redactSecrets(message)}\n`);
    process.exit(1);
  });
}
