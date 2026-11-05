import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = process.cwd(); const node = process.execPath; const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v299-v404 reseal", node, ["scripts/reseal-shadow-evidence-chain-v404.mjs"]);
run("v405 dossier and observatory", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-evidence-observatory-v405.ts"]);
run("v405 evidence and pointer", node, ["scripts/build-shadow-candidate-v405.mjs"]);
console.log(JSON.stringify({ status: "resealed-v299-v405-lightweight-chain", first: "v299", last: "v405", browserRun: false, visualMatrixRun: false, denseCampaignRun: false }, null, 2));
