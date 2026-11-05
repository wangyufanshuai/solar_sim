import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/atlas-browser",
  testMatch: "atlas-visual-freeze-v585.spec.ts",
  timeout: 600_000,
  expect: { timeout: 30_000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [
    ["line"],
    ["json", { outputFile: "output/playwright/v585/playwright-result.json" }],
  ],
  use: {
    browserName: "chromium",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3158 --profile standalone-full",
      url: "http://127.0.0.1:3158/api/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-lite-current --port 3159 --profile vercel-lite",
      url: "http://127.0.0.1:3159/api/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-local-shadow-current --port 3160 --profile local-shadow",
      url: "http://127.0.0.1:3160/api/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
