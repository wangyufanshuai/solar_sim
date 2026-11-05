import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};

run("v299-v399 reseal", node, ["scripts/reseal-shadow-evidence-chain-v399.mjs"]);
run("v400 observation hub artifact", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-atlas-observation-hub-v400.ts",
]);
run("v400 evidence and pointer", node, ["scripts/build-shadow-candidate-v400.mjs"]);

console.log(JSON.stringify({
  status: "resealed-v299-v400-lightweight-chain",
  first: "v299",
  last: "v400",
  observationHubArtifactRebuiltAfterV399: true,
  physicalValuesAdded: false,
  compileRun: false,
  denseCampaignRun: false,
  browserRun: false,
}, null, 2));
