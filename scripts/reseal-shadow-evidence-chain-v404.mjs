import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v299-v403 reseal", node, ["scripts/reseal-shadow-evidence-chain-v403.mjs"]);
run("v404 bounded summary", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-observation-lifecycle-summary-v404.ts"]);
run("v404 evidence and pointer", node, ["scripts/build-shadow-candidate-v404.mjs"]);
console.log(JSON.stringify({ status: "resealed-v299-v404-lightweight-chain", first: "v299", last: "v404", cycleDetailsExposed: false, browserSoakRun: false, denseCampaignRun: false }, null, 2));
