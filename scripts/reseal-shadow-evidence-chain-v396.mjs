import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["scripts/build-shadow-candidate-v396.mjs"],
  { cwd: process.cwd(), stdio: "inherit", shell: false },
);
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`v396 evidence reseal failed with ${result.status}`);
console.log(JSON.stringify({ status: "resealed-v396-lightweight-chain", previous: "v395-preserved", current: "v396" }, null, 2));
