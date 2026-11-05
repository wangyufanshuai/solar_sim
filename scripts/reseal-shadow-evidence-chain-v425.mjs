import { spawnSync } from "node:child_process";
const root = process.cwd(), node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v425 spectral admission chain", node, ["scripts/build-kerr-instrument-spectral-admission-chain-v425.mjs"]);
run("v425 evidence and pointer", node, ["scripts/build-shadow-candidate-v425.mjs"]);
