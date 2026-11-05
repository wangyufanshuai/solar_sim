import { spawnSync } from "node:child_process";

const run = (label, script) => { const result = spawnSync(process.execPath, [script], { cwd: process.cwd(), stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v299-v398 reseal", "scripts/reseal-shadow-evidence-chain-v398.mjs");
run("v399 reseal", "scripts/build-shadow-candidate-v399.mjs");
console.log(JSON.stringify({ status: "resealed-v299-v399-lightweight-chain", first: "v299", last: "v399", physicalValuesAdded: false, compileRun: false, denseCampaignRun: false, browserRun: false }, null, 2));
