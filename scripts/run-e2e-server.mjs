import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { applyE2eEnvironment, childEnvironment } = require("./load-e2e-env.cjs");

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

/**
 * @param {import("node:child_process").ChildProcess} child
 */
function stopChild(child) {
  if (child.pid === undefined) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

function startE2eServer() {
  applyE2eEnvironment();

  // `npm run dev` is `next dev`. Invoke the Next binary with Node so Windows
  // does not need a shell, and forward signals to that single child.
  const nextBin = path.join(
    repoRoot,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  );
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1"],
    {
      cwd: repoRoot,
      env: childEnvironment(),
      stdio: "inherit",
      detached: process.platform !== "win32",
      windowsHide: true,
    }
  );

  let stopping = false;

  const requestStop = () => {
    if (stopping) {
      return;
    }

    stopping = true;
    stopChild(child);
  };

  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, requestStop);
  }

  child.on("error", (error) => {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "error";
    process.stderr.write(`Failed to start the E2E dev server (${code}).\n`);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(stopping ? 0 : (code ?? 1));
  });
}

function isDirectRun() {
  const entry = process.argv[1];

  if (!entry) {
    return false;
  }

  const modulePath = fileURLToPath(import.meta.url);

  return (
    path.resolve(entry).toLowerCase() === path.resolve(modulePath).toLowerCase()
  );
}

if (isDirectRun()) {
  try {
    startE2eServer();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start the E2E dev server.";
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}
