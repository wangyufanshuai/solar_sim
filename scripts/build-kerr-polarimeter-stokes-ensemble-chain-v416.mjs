import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};

run("v416 independent Stokes ensemble oracle", "python", [
  "scripts/run-kerr-polarimeter-stokes-ensemble-oracle-v416.py",
]);
run("v416 Stokes ensemble", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-polarimeter-stokes-ensemble-v416.ts",
]);
