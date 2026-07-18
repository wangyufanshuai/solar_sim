import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3026";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-vercel-lite-v174.spec.ts",
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  metadata: {
    atlasFreshPort: 3026,
    atlasDistDir: ".next-v180-lite",
  },
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v180-lite --port 3026",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
