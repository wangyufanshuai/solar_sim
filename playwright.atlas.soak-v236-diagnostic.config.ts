import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

process.env.ATLAS_SOAK_CYCLES = "15";
process.env.ATLAS_SOAK_WARMUP_CYCLES = "2";
process.env.ATLAS_SOAK_TEXTURE_AUDIT = "1";

const baseURL = "http://127.0.0.1:3105";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-lifecycle-soak-v178.spec.ts",
  timeout: 900_000,
  fullyParallel: false,
  workers: 1,
  metadata: {
    soakEvidenceVersion: "v236-production-lifecycle-soak-texture-diagnostic",
    soakEvidenceOutput: "dist/science/lifecycle-soak-v236-texture-diagnostic.json",
    soakRuntimeBaseline: "next16-react19-r3f9-standalone-production-v236",
  },
  projects: [{
    name: "desktop-hardware-production-chrome-1440x900",
    use: { viewport: { width: 1440, height: 900 } },
  }],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command:
      "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3105",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
