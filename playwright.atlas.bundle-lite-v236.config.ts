import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

process.env.ATLAS_BUNDLE_EVIDENCE_VERSION = "v236";

const baseURL = "http://127.0.0.1:3133";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-bundle-budget-v198.spec.ts",
  fullyParallel: false,
  workers: 1,
  projects: [
    {
      name: "lite-chrome-1440x900",
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-lite-current --port 3133",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
