import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

process.env.ATLAS_SOAK_CYCLES = "30";
process.env.ATLAS_SOAK_WARMUP_CYCLES = "2";
process.env.ATLAS_SOAK_TEXTURE_AUDIT = "1";

const baseURL = "http://127.0.0.1:3138";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-lifecycle-soak-v178.spec.ts",
  timeout: 1_200_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "output/playwright/v275-shadow-soak-diagnostic-result.json" }],
  ],
  metadata: {
    atlasFreshPort: 3138,
    soakEvidenceVersion: "v275-current-memory-lifecycle-soak-30-cycle-diagnostic",
    soakEvidenceOutput: "dist/science/lifecycle-soak-v275-diagnostic.json",
    soakRuntimeBaseline: "next16-react19-r3f9-standalone-v275-current-memory-nonqualifying",
  },
  projects: [{
    name: "desktop-v275-soak-diagnostic-chrome-1440x900",
    use: { viewport: { width: 1440, height: 900 } },
  }],
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3138",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
