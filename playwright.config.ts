import { defineConfig, devices } from "@playwright/test";

declare module "./scripts/load-e2e-env.cjs" {
  export function applyE2eEnvironment(): void;
}

import { applyE2eEnvironment } from "./scripts/load-e2e-env.cjs";

// Give Next.js the local E2E Supabase settings before workers or the
// web server start. The loader never prints variable values.
applyE2eEnvironment();

const desktopChrome = { ...devices["Desktop Chrome"] };

/**
 * Public smoke stays unauthenticated. Patient isolation uses storage
 * states created by the setup project from the real login form.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // One worker keeps the local Next server and browser inside a small
  // memory budget. Authenticated tests stay isolated by browser context.
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "setup-patient-a",
      testMatch: /auth\.setup\.ts/,
      grep: /patient A/,
    },
    {
      name: "setup-patient-b",
      testMatch: /auth\.setup\.ts/,
      grep: /patient B/,
    },
    {
      name: "chromium",
      testMatch: /public-smoke\.spec\.ts/,
      use: desktopChrome,
    },
    {
      name: "patient-a",
      dependencies: ["setup-patient-a"],
      testMatch: /patient-isolation\.spec\.ts/,
      grep: /@patient-a/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      name: "patient-b",
      dependencies: ["setup-patient-b"],
      testMatch: /patient-isolation\.spec\.ts/,
      grep: /@patient-b/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-b.json",
      },
    },
    {
      // Reuses Patient A's setup storage state. Run this project on its own:
      // its logout revokes that local session, as does the isolation suite.
      name: "patient-flow",
      dependencies: ["setup-patient-a"],
      testMatch: /patient-flow\.spec\.ts/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
  ],
  webServer: {
    command: "node scripts/run-e2e-server.mjs",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
