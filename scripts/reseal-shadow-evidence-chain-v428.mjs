import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
function run(label, command, args) { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); }
run("v428 response intake chain", node, ["scripts/build-kerr-high-energy-response-intake-chain-v428.mjs"]);
run("v428 evidence and capability pointer", node, ["scripts/build-shadow-candidate-v428.mjs"]);
