import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3135";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-observation-planner-v266.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 150_000,
  reporter: [
    ["list"],
    ["json", { outputFile: "dist/science/observation-planner-v266-browser-result.json" }],
  ],
  projects: [
    { name: "desktop-v266", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile-v266", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
    bypassCSP: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3135",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
