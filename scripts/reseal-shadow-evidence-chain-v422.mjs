import { spawnSync } from "node:child_process";
const root = process.cwd(), node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v422 mask-aware orientation-basis chain", node, ["scripts/build-kerr-orientation-basis-chain-v422.mjs"]);
run("v422 evidence and pointer", node, ["scripts/build-shadow-candidate-v422.mjs"]);
