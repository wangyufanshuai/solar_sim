import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v421 independent Astropy axial-vector oracle", "python", ["scripts/run-kerr-axial-polarization-oracle-v421.py"]);
run("v421 TypeScript axial-vector catalog", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-axial-polarization-v421.ts"]);
run("v421 FITS axial-vector table and corrected PNG", "python", ["scripts/export-kerr-axial-polarization-v421.py"]);
