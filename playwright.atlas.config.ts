import { defineConfig } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3001";

export default defineConfig({
  testDir: "./tests/atlas-browser",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  timeout: 420_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: baseUrl,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "desktop-chrome-1440x900",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile-chrome-390x844",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `${baseUrl}/?presentation=sandbox`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
