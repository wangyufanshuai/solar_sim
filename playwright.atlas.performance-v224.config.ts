import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3070";

export default defineConfig({
  ...baseConfig,
  testMatch: "scientific-performance-v5.spec.ts",
  timeout: 300_000,
  fullyParallel: false,
  workers: 1,
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  metadata: {
    atlasFreshPort: 3070,
    performanceEvidenceVersion: "v224-hardware-performance-production",
    performanceEvidenceOutput: "dist/science/performance-v224-report.json",
    performanceRuntimeBaseline: "next16-react19-r3f9-standalone-production-v224",
  },
  projects: [{
    name: "desktop-hardware-production-chrome-1440x900",
    use: { viewport: { width: 1440, height: 900 } },
  }],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v224 --port 3070",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
