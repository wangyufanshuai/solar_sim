import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};

run("v424 independent ideal-modulation Python oracle", "python", ["scripts/run-kerr-predicted-polarimeter-oracle-v424.py"]);
run("v424 TypeScript ideal HWP-Wollaston prediction", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-predicted-polarimeter-v424.ts"]);
run("v424 FITS table and modulation diagnostic", "python", ["scripts/export-kerr-predicted-polarimeter-v424.py"]);
