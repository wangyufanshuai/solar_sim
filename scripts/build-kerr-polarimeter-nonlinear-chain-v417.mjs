import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v417 independent nonlinear oracle", "python", ["scripts/run-kerr-polarimeter-nonlinear-oracle-v417.py"]);
run("v417 nonlinear observables", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-polarimeter-nonlinear-v417.ts",
]);
