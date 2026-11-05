import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3137";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-shadow-lite-v275.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "output/playwright/v275-shadow-lite-result.json" }],
  ],
  timeout: 120_000,
  projects: [{ name: "lite-v275-chrome-1440x900", use: { viewport: { width: 1440, height: 900 } } }],
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-lite-current --port 3137",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
