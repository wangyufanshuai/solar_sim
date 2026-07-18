import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3025";

export default defineConfig({
  ...baseConfig,
  testMatch: [
    "atlas-browser-acceptance.spec.ts",
    "atlas-v180-reload-closeup.spec.ts",
    "atlas-react19-r3f9-v174.spec.ts",
    "mobile-gas-closeup-visual.spec.ts",
  ],
  globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts",
  metadata: {
    atlasFreshPort: 3025,
    atlasDistDir: ".next-v180",
  },
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-v180 --port 3025",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
