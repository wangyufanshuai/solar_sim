import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3024";
export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-bundle-budget-v177.spec.ts",
  fullyParallel: false,
  workers: 1,
  projects: [{ name: "vercel-lite-chrome-1440x900", use: { viewport: { width: 1440, height: 900 } } }],
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v180-lite --port 3024",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
