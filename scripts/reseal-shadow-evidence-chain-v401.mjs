import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v299-v400 reseal", node, ["scripts/reseal-shadow-evidence-chain-v400.mjs"]);
run("v401 evidence cache artifact", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-observation-evidence-cache-v401.ts"]);
run("v401 evidence and pointer", node, ["scripts/build-shadow-candidate-v401.mjs"]);
console.log(JSON.stringify({ status: "resealed-v299-v401-lightweight-chain", first: "v299", last: "v401", evidenceRequestsExecuted: 0, automaticRetryApplied: false, denseCampaignRun: false, browserRun: false }, null, 2));
