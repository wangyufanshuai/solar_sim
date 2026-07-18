import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync(
  process.execPath,
  [
    resolve("node_modules", "playwright", "cli.js"),
    "test",
    "-c",
    "playwright.atlas.fresh.config.ts",
  ],
  {
    env: {
      ...process.env,
      ATLAS_BROWSER_REVIEW_SCREENSHOTS: "1",
    },
    shell: false,
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
