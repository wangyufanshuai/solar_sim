import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3085";

export default defineConfig({
  ...baseConfig,
  testMatch: [
    "atlas-browser-acceptance.spec.ts",
    "atlas-v180-reload-closeup.spec.ts",
    "atlas-react19-r3f9-v174.spec.ts",
    "atlas-validation-readiness-v200.spec.ts",
    "mobile-gas-closeup-visual.spec.ts",
  ],
  metadata: { atlasFreshPort: 3085, atlasDistDir: ".next-atlas-standalone-current" },
  // axe-core uses generated Function bodies internally; production CSP stays
  // enforced and is tested separately at the response-header boundary.
  use: { ...(typeof baseConfig.use === "object" ? baseConfig.use : {}), baseURL, bypassCSP: true },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3085",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
