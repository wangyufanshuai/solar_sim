import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3017";

export default defineConfig({
  ...baseConfig,
  testMatch: "scientific-performance-v5.spec.ts",
  timeout: 240_000,
  fullyParallel: false,
  workers: 1,
  metadata: {
    performanceEvidenceVersion: "v166-hardware-performance-production",
    performanceEvidenceOutput: "dist/science/performance-v166-report.json",
    performanceRuntimeBaseline: "next-standalone-production-v166",
  },
  projects: [
    {
      name: "desktop-hardware-production-chrome-1440x900",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --port 3017",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
