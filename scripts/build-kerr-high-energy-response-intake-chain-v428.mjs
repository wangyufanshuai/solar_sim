import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v428 secure intake fixture and adversarial archive oracle", "python", ["scripts/kerr-high-energy-response-intake-v428.py", "--build-fixture"]);
run("v428 TypeScript cross-language intake compiler", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-high-energy-response-intake-v428.ts"]);
run("v428 intake architecture and export manifest", "python", ["scripts/export-kerr-high-energy-response-intake-v428.py"]);
