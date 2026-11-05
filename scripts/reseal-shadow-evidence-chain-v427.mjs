import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v427 high-energy response acquisition chain", node, ["scripts/build-kerr-high-energy-response-acquisition-chain-v427.mjs"]);
run("v427 evidence and capability pointer", node, ["scripts/build-shadow-candidate-v427.mjs"]);
