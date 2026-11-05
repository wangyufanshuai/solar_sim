import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = process.env.ATLAS_VISUAL_BASE_URL ?? "http://127.0.0.1:3021";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-visual-journeys-v197.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
  },
  webServer: {
    command: "npx next dev -H 127.0.0.1 -p 3021 --webpack",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
