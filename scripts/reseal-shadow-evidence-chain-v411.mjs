import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd(); const node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v411 calibration inspect", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-polarimeter-calibration-v411.ts"]);
run("v411 evidence and pointer", node, ["scripts/build-shadow-candidate-v411.mjs"]);
console.log(JSON.stringify({ status: "resealed-v411-lightweight-chain-with-v410-history-immutable", previousEvidenceResealed: false, measuredInputImported: false, networkAttempted: false, detectorFallbackUsed: false, denseCampaignRun: false, browserRun: false }, null, 2));
