import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const audit = spawnSync(
  process.execPath,
  [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-detector-provenance-envelope-v510.ts"],
  { cwd: root, encoding: "utf8", stdio: "inherit" },
);
if (audit.status !== 0) throw new Error(`v510-envelope-audit-exit-${audit.status}`);
await import("./build-shadow-candidate-v510.mjs");
