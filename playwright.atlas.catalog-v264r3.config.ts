import { defineConfig } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3016";

export default defineConfig({
  testDir: "./tests/atlas-browser",
  testMatch: "**/atlas-catalog-stream-v264r3.spec.ts",
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "dist/science/browser-catalog-v264r3-result.json" }],
  ],
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: baseUrl,
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3016",
    url: `${baseUrl}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
