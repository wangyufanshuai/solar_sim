import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = process.cwd(); const node = process.execPath; const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v409 corrected sparse Stokes payload", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-scattering-corrected-v409.ts"]); run("v409 evidence and pointer", node, ["scripts/build-shadow-candidate-v409.mjs"]);
console.log(JSON.stringify({ status: "resealed-v409-lightweight-chain-with-v408-history-immutable", previousEvidenceResealed: false, numericalOracleRerun: false, denseCampaignRun: false, browserRun: false }, null, 2));
