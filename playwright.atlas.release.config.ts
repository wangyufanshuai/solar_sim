import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.atlas.config";

const baseUrl = "http://127.0.0.1:3016";

export default defineConfig({
  ...baseConfig,
  timeout: 600_000,
  use: {
    ...(typeof baseConfig.use === "object" ? baseConfig.use : {}),
    baseURL: baseUrl,
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3016",
    url: `${baseUrl}/?presentation=sandbox`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

