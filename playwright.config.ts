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
 * Public smoke stays unauthenticated. Patient and medical projects use
 * storage states created by setup projects from the real login form.
 * The revocation project is separate so it can change authorization state
 * without rerunning the stable read-only suites.
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
      name: "setup-medical-a",
      testMatch: /auth\.setup\.ts/,
      grep: /medical A/,
    },
    {
      name: "setup-medical-b",
      testMatch: /auth\.setup\.ts/,
      grep: /medical B/,
    },
    {
      name: "setup-authorizations",
      dependencies: ["setup-patient-a", "setup-patient-b"],
      testMatch: /medical-flow\.spec\.ts/,
      grep: /@authorization-fixture/,
      use: {
        ...desktopChrome,
        screenshot: "off",
        trace: "off",
        video: "off",
      },
    },
    {
      name: "chromium",
      testMatch: /public-smoke\.spec\.ts/,
      use: desktopChrome,
    },
    {
      name: "keyboard-public",
      testMatch: /keyboard-navigation\.spec\.ts/,
      grep: /@keyboard-public/,
      use: desktopChrome,
    },
    {
      name: "keyboard-patient",
      dependencies: ["setup-patient-a"],
      testMatch: /keyboard-navigation\.spec\.ts/,
      grep: /@keyboard-patient/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      name: "keyboard-medical",
      dependencies: ["setup-medical-a"],
      testMatch: /keyboard-navigation\.spec\.ts/,
      grep: /@keyboard-medical/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/medical-a.json",
      },
    },
    {
      name: "visual-public",
      testMatch: /visual-feedback\.spec\.ts/,
      grep: /@visual-public/,
      use: desktopChrome,
    },
    {
      name: "visual-patient",
      dependencies: ["setup-patient-a"],
      testMatch: /visual-feedback\.spec\.ts/,
      grep: /@visual-patient/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      name: "visual-medical",
      dependencies: ["setup-medical-a"],
      testMatch: /visual-feedback\.spec\.ts/,
      grep: /@visual-medical/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/medical-a.json",
      },
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
    {
      name: "medical-a",
      dependencies: ["setup-medical-a", "setup-authorizations"],
      testMatch: /medical-flow\.spec\.ts/,
      grep: /@medical-a/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/medical-a.json",
      },
    },
    {
      name: "medical-b",
      dependencies: ["setup-medical-b", "setup-authorizations"],
      testMatch: /medical-flow\.spec\.ts/,
      grep: /@medical-b/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/medical-b.json",
      },
    },
    {
      // Serial revocation changes Patient A's active authorization, then
      // restores it. It opens its own contexts and must not share a page
      // with the stable medical projects.
      name: "medical-flow",
      dependencies: ["setup-medical-a", "setup-authorizations"],
      testMatch: /medical-flow\.spec\.ts/,
      grep: /@medical-revocation/,
      use: {
        ...desktopChrome,
        screenshot: "off",
        trace: "off",
        video: "off",
      },
    },
    {
      // Global sign-out revokes the medical session, so this stays outside
      // the stable read projects.
      name: "medical-logout",
      dependencies: ["setup-medical-a", "setup-medical-b"],
      testMatch: /medical-flow\.spec\.ts/,
      grep: /@medical-logout/,
      use: desktopChrome,
    },
  ],
  webServer: {
    command: "node scripts/run-e2e-server.mjs",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
