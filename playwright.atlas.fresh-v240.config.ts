import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3110";

export default defineConfig({
  ...baseConfig,
  testMatch: [
    "atlas-browser-acceptance.spec.ts",
    "atlas-v180-reload-closeup.spec.ts",
    "atlas-react19-r3f9-v174.spec.ts",
    "atlas-validation-readiness-v200.spec.ts",
    "mobile-gas-closeup-visual.spec.ts",
  ],
  metadata: { atlasFreshPort: 3110, atlasDistDir: ".next-atlas-standalone-current" },
  fullyParallel: false,
  workers: 1,
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
    bypassCSP: true,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3110",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
