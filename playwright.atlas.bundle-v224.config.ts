import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

process.env.ATLAS_BUNDLE_EVIDENCE_VERSION = "v224";

const baseURL = "http://127.0.0.1:3068";
export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-bundle-budget-v198.spec.ts",
  fullyParallel: false,
  workers: 1,
  projects: [{ name: "standalone-chrome-1440x900", use: { viewport: { width: 1440, height: 900 } } }],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v224 --port 3068",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
