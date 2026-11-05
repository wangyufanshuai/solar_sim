import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3019";

export default defineConfig({
  ...baseConfig,
  testIgnore: ["**/scientific-performance-v5.spec.ts", "**/atlas-vercel-lite-v174.spec.ts"],
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  metadata: {
    atlasFreshPort: 3019,
    atlasDistDir: ".next-v174",
  },
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v174 --port 3019",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
