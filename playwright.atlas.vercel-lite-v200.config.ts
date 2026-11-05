import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3051";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-vercel-lite-v174.spec.ts",
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  metadata: { atlasFreshPort: 3051, atlasDistDir: ".next-v200-lite" },
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v200-lite --port 3051",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
