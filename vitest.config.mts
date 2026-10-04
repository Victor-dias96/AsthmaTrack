import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

const srcDirectory = fileURLToPath(new URL("./src", import.meta.url));

// These suites register tests with node:test. Vitest discovers the same
// filenames but does not collect those tests, so they stay on Node's runner.
const nodeTestFiles = [
  "src/features/medical-team/lib/authorized-patient-latest-record.test.ts",
  "src/features/medical-team/lib/authorized-patient-search.test.ts",
  "src/features/medical-team/lib/build-medical-patient-report-summaries.test.ts",
  "src/features/medical-team/lib/get-medical-patient-dashboard-period-href.test.ts",
  "src/features/medical-team/lib/get-medical-patient-history-href.test.ts",
  "src/features/medical-team/lib/get-medical-patient-report-href.test.ts",
  "src/features/medical-team/lib/map-medical-patient-dashboard-record-row.test.ts",
  "src/features/medical-team/lib/medical-patient-report-boundaries.test.ts",
  "src/features/medical-team/lib/medical-read-only-boundaries.test.ts",
  "src/features/medical-team/lib/page-medical-patient-history-records.test.ts",
  "src/features/medical-team/lib/parse-medical-patient-id.test.ts",
  "src/features/pwa/lib/connection-status-boundaries.test.ts",
  "src/features/pwa/lib/connection-status.test.ts",
  "src/features/pwa/lib/get-pwa-install-card-model.test.ts",
  "src/features/pwa/lib/offline-page-boundaries.test.ts",
  "src/features/pwa/lib/pwa-install-boundaries.test.ts",
  "src/features/pwa/lib/pwa-installation-session.test.ts",
  "src/features/pwa/lib/read-standalone-display.test.ts",
  "src/features/pwa/lib/register-service-worker.test.ts",
  "src/features/pwa/lib/service-worker-boundaries.test.ts",
  "src/features/pwa/lib/service-worker-update-boundaries.test.ts",
  "src/features/pwa/lib/service-worker-update.test.ts",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": srcDirectory,
    },
  },
  test: {
    // The pure unit test does not use Node-only APIs, so one jsdom
    // environment covers it and synchronous component tests.
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      ...configDefaults.exclude,
      "**/.next/**",
      "**/public/**",
      ...nodeTestFiles,
    ],
  },
});
