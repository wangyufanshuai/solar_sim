import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3134";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-catalog-intent-v255.spec.ts",
  fullyParallel: false,
  workers: 1,
  projects: [{
    name: "v255-catalog-intent-chrome-1440x900",
    use: { viewport: { width: 1440, height: 900 } },
  }],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3134",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
