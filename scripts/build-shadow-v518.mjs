import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync(
  process.execPath,
  [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-provenance-constellation-audit-v518.ts"],
  { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" },
);
if (result.status !== 0) throw new Error(`v518-build-exit-${result.status}`);

await import("./build-shadow-candidate-v518.mjs");
