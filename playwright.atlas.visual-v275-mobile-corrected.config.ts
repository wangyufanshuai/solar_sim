import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseURL = "http://127.0.0.1:3142";

export default defineConfig({
  ...baseConfig,
  testMatch: "atlas-visual-v275-four-way.spec.ts",
  timeout: 900_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "output/playwright/v275-shadow-visual-mobile-corrected-result.json" }],
  ],
  metadata: {
    visualOutputRoot: "output/playwright/v275-visual-four-way-mobile-corrected-current-memory",
    visualReportOutput: "dist/science/visual-matrix-v275-mobile-390x844-corrected.json",
    correctedViewportRoute: "mobile-more-menu-visible-launch-entry",
    priorNegativeEvidence: "dist/science/visual-matrix-v275-current-memory-negative-evidence.json",
  },
  projects: [{
    name: "mobile-v275-visual-four-way-corrected-chrome-390x844",
    use: {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      contextOptions: { reducedMotion: "reduce" },
    },
  }],
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3142",
    url: `${baseURL}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
