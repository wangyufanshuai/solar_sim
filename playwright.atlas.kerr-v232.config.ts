import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3086";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-kerr-raytrace-v208.spec.ts",
  fullyParallel: false,
  workers: 1,
  projects: [
    { name: "desktop-kerr-v232", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile-kerr-v232", use: { viewport: { width: 390, height: 844 } } },
  ],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3086",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

