import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseUrl = "http://127.0.0.1:3015";

export default defineConfig({
  ...baseConfig,
  testIgnore: "**/scientific-performance-v5.spec.ts",
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL: baseUrl,
  },
  webServer: {
    command: "npm run build && node scripts/start-atlas-standalone.mjs --port 3015",
    url: `${baseUrl}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
