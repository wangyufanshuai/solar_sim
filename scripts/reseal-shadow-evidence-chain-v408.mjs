import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};

run("v408 portable scattering envelope", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-scattering-oracle-v408.ts"]);
run("v408 evidence and pointer", node, ["scripts/build-shadow-candidate-v408.mjs"]);
console.log(JSON.stringify({
  status: "resealed-v408-lightweight-chain-with-v407-history-immutable",
  previousEvidenceResealed: false,
  pythonOracleRerun: false,
  denseCampaignRun: false,
  browserRun: false,
  visualMatrixRun: false,
}, null, 2));
