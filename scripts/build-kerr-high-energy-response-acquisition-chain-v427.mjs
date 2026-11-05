import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v427 independent acquisition validator fixture oracle", "python", ["scripts/run-kerr-high-energy-response-acquisition-oracle-v427.py"]);
run("v427 empty acquisition pack and fail-closed validator", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-high-energy-response-acquisition-pack-v427.ts"]);
run("v427 deterministic ZIP, FITS plan and architecture diagram", "python", ["scripts/export-kerr-high-energy-response-acquisition-pack-v427.py"]);
