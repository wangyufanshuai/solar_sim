import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3032";
export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-lifecycle-soak-v178.spec.ts",
  timeout: 600_000,
  fullyParallel: false,
  workers: 1,
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  projects: [{ name: "desktop-hardware-production-chrome-1440x900", use: { viewport: { width: 1440, height: 900 } } }],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v186 --port 3032",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
