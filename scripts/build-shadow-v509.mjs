import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const audit = spawnSync(
  process.execPath,
  [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-detector-evidence-timeline-v509.ts"],
  { cwd: process.cwd(), stdio: "inherit", shell: false },
);
if (audit.error) throw audit.error;
if (audit.status !== 0) throw new Error(`v509-timeline-audit-exit-${audit.status}`);
await import("./build-shadow-candidate-v509.mjs");
