import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseUrl = "http://127.0.0.1:3018";

export default defineConfig({
  ...baseConfig,
  testIgnore: "**/scientific-performance-v5.spec.ts",
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  metadata: {
    atlasFreshPort: 3018,
    atlasDistDir: ".next-v167",
  },
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL: baseUrl,
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v167 --port 3018",
    url: `${baseUrl}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
