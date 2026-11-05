import { spawnSync } from "node:child_process";

const run = (label, script) => { const result = spawnSync(process.execPath, [script], { cwd: process.cwd(), stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v299-v397 reseal", "scripts/reseal-shadow-evidence-chain-v397.mjs");
run("v398 reseal", "scripts/build-shadow-candidate-v398.mjs");
console.log(JSON.stringify({ status: "resealed-v299-v398-lightweight-chain", first: "v299", last: "v398", compileRun: false, denseCampaignRun: false, browserRun: false }, null, 2));
