import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync(
  process.execPath,
  [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-grid-axis-influence-runtime-v533.ts"],
  { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" },
);
if (result.status !== 0) throw new Error(`v533-runtime-exit-${result.status}`);
await import("./build-shadow-candidate-v533.mjs");
