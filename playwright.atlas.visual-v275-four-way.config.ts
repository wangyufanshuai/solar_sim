import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3141";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-visual-v275-four-way.spec.ts",
  timeout: 900_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "output/playwright/v275-shadow-visual-four-way-result.json" }],
  ],
  projects: [
    { name: "desktop-v275-visual-four-way-chrome-1440x900", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile-v275-visual-four-way-chrome-390x844", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, contextOptions: { reducedMotion: "reduce" } } },
  ],
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3141",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
