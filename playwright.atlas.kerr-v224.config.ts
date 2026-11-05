import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3066";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-kerr-raytrace-v208.spec.ts",
  fullyParallel: false,
  workers: 1,
  projects: [
    { name: "desktop-kerr-v224", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile-kerr-v224", use: { viewport: { width: 390, height: 844 } } },
  ],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v224 --port 3066",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
