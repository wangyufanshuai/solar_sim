import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

process.env.ATLAS_SOAK_CYCLES = "30";
process.env.ATLAS_SOAK_WARMUP_CYCLES = "2";
process.env.ATLAS_SOAK_TEXTURE_AUDIT = "1";

const baseURL = "http://127.0.0.1:3140";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-lifecycle-soak-v178.spec.ts",
  timeout: 1_200_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "output/playwright/v275-shadow-soak-corrected-current-memory-result.json" }],
  ],
  metadata: {
    atlasFreshPort: 3140,
    soakEvidenceVersion: "v275-current-memory-lifecycle-soak-30-cycle-corrected-v1",
    soakEvidenceOutput: "dist/science/lifecycle-soak-v275-corrected-current-memory.json",
    soakRuntimeBaseline: "next16-react19-r3f9-standalone-v275-current-memory-nonqualifying-corrected",
  },
  projects: [{
    name: "desktop-v275-soak-corrected-current-memory-chrome-1440x900",
    use: { viewport: { width: 1440, height: 900 } },
  }],
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3140",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
