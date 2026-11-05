import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3136";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-v262-mobile-ab.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  projects: [{
    name: "v262-local-mobile-chrome-390x844",
    use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  }],
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
    bypassCSP: true,
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3136",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
