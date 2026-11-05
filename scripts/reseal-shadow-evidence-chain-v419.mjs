import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v419 coordinate chain", node, ["scripts/build-kerr-screen-coordinate-chain-v419.mjs"]);
run("v419 evidence and pointer", node, ["scripts/build-shadow-candidate-v419.mjs"]);
