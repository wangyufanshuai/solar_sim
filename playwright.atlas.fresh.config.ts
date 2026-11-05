import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseUrl = "http://127.0.0.1:3015";
const jsonReport = process.env.ATLAS_FRESH_V263_JSON_REPORT;

export default defineConfig({
  ...baseConfig,
  metadata: {
    ...(baseConfig.metadata ?? {}),
    atlasFreshPort: 3015,
    atlasFreshBuildId: "19OANocf2iaAVsGCShYAk",
  },
  workers: 1,
  retries: 0,
  reporter: jsonReport
    ? [["list"], ["json", { outputFile: jsonReport }]]
    : [["list"]],
  testIgnore: [
    "**/scientific-performance-v5.spec.ts",
    "**/atlas-lifecycle-soak-v178.spec.ts",
    "**/atlas-v262-lite-boundary.spec.ts",
    "**/atlas-vercel-lite-v174.spec.ts",
    "**/atlas-v262-mobile-ab.spec.ts",
    "**/atlas-visual-journeys-v197.spec.ts",
    "**/atlas-visual-risks-v240.spec.ts",
  ],
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL: baseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3015",
    url: `${baseUrl}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
