import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v299-v406 reseal", node, ["scripts/reseal-shadow-evidence-chain-v406.mjs"]);
run("v407 scattering atmosphere", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-scattering-atmosphere-v407.ts"]);
run("v407 evidence and pointer", node, ["scripts/build-shadow-candidate-v407.mjs"]);
console.log(JSON.stringify({ status: "resealed-v299-v407-lightweight-chain", first: "v299", last: "v407", denseCampaignRun: false, browserRun: false, visualMatrixRun: false }, null, 2));
