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
 *
 * Ordering matters for the full suite. Signing out is global in Supabase
 * Auth: it revokes every session of that account, including the storage
 * state files the other projects load. Playwright runs a project only after
 * its dependencies, so each project that signs an account out depends on
 * every project that still needs that account's session:
 *
 * - patient-flow signs Patient A out, so it runs after every other Patient A
 *   consumer. Patient A's logout check then gets its own, later session
 *   (setup-patient-a-logout) and is the last Patient A project.
 * - medical-logout signs Medical A and Medical B out, so it runs after every
 *   Medical A and Medical B consumer.
 *
 * Dependencies also run when a single project is selected. To run one
 * destructive project alone against an existing storage state, add
 * `--no-deps` and select `setup-records` with it when fixtures may be old.
 */
const patientAReaders = [
  "keyboard-patient",
  "visual-patient",
  "semantics-patient",
  "responsive-patient",
  "patient-a",
  "medical-flow",
];

const medicalReaders = [
  "keyboard-medical",
  "visual-medical",
  "semantics-medical",
  "responsive-medical",
  "medical-a",
  "medical-b",
  "medical-flow",
];
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
      // Re-anchors the two fixture measurements inside the default periods.
      // It signs in with its own in-memory sessions and never signs out
      // globally, so it cannot revoke any storage state.
      name: "setup-records",
      testMatch: /records\.setup\.ts/,
    },
    {
      name: "setup-authorizations",
      dependencies: ["setup-patient-a", "setup-patient-b", "setup-records"],
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
      dependencies: ["setup-patient-a", "setup-records"],
      testMatch: /keyboard-navigation\.spec\.ts/,
      grep: /@keyboard-patient/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      name: "keyboard-medical",
      dependencies: ["setup-medical-a", "setup-authorizations"],
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
      dependencies: ["setup-patient-a", "setup-records"],
      testMatch: /visual-feedback\.spec\.ts/,
      grep: /@visual-patient/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      name: "visual-medical",
      dependencies: ["setup-medical-a", "setup-authorizations"],
      testMatch: /visual-feedback\.spec\.ts/,
      grep: /@visual-medical/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/medical-a.json",
      },
    },
    {
      name: "semantics-public",
      testMatch: /screen-reader-semantics\.spec\.ts/,
      grep: /@semantics-public/,
      use: desktopChrome,
    },
    {
      name: "semantics-patient",
      dependencies: ["setup-patient-a", "setup-records"],
      testMatch: /screen-reader-semantics\.spec\.ts/,
      grep: /@semantics-patient/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      name: "semantics-medical",
      dependencies: ["setup-medical-a", "setup-authorizations"],
      testMatch: /screen-reader-semantics\.spec\.ts/,
      grep: /@semantics-medical/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/medical-a.json",
      },
    },
    {
      name: "responsive-public",
      testMatch: /responsive-layout\.spec\.ts/,
      grep: /@responsive-public/,
      use: {
        ...desktopChrome,
        screenshot: "off",
        trace: "off",
        video: "off",
      },
    },
    {
      name: "responsive-patient",
      dependencies: ["setup-patient-a", "setup-records"],
      testMatch: /responsive-layout\.spec\.ts/,
      grep: /@responsive-patient/,
      use: {
        ...desktopChrome,
        screenshot: "off",
        trace: "off",
        video: "off",
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      name: "responsive-medical",
      dependencies: ["setup-medical-a", "setup-authorizations"],
      testMatch: /responsive-layout\.spec\.ts/,
      grep: /@responsive-medical/,
      use: {
        ...desktopChrome,
        screenshot: "off",
        trace: "off",
        video: "off",
        storageState: "playwright/.auth/medical-a.json",
      },
    },
    {
      name: "patient-a",
      dependencies: ["setup-patient-a", "setup-records"],
      testMatch: /patient-isolation\.spec\.ts/,
      grep: /@patient-a/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      name: "patient-b",
      dependencies: ["setup-patient-b", "setup-records"],
      testMatch: /patient-isolation\.spec\.ts/,
      grep: /@patient-b/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-b.json",
      },
    },
    {
      // Reuses Patient A's setup storage state and ends with a logout, which
      // revokes every Patient A session. It therefore waits for every other
      // project that reads with that session.
      name: "patient-flow",
      dependencies: ["setup-patient-a", "setup-records", ...patientAReaders],
      testMatch: /patient-flow\.spec\.ts/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a.json",
      },
    },
    {
      // A session created after patient-flow's logout, for the isolation
      // suite's own logout check. Nothing else uses it.
      name: "setup-patient-a-logout",
      dependencies: ["patient-flow"],
      testMatch: /auth\.setup\.ts/,
      grep: /fresh session for patient logout/,
    },
    {
      name: "patient-a-logout",
      dependencies: ["setup-patient-a-logout"],
      testMatch: /patient-isolation\.spec\.ts/,
      grep: /@patient-logout-a/,
      use: {
        ...desktopChrome,
        storageState: "playwright/.auth/patient-a-logout.json",
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
      dependencies: ["setup-medical-a", "setup-medical-b", ...medicalReaders],
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
