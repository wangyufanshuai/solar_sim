import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v419 independent Python screen-coordinate oracle", "python", ["scripts/run-kerr-screen-coordinate-oracle-v419.py"]);
run("v419 TypeScript screen-coordinate provenance", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-screen-coordinate-provenance-v419.ts"]);
run("v419 FITS table and sparse quiver diagnostic", "python", ["scripts/export-kerr-screen-coordinate-v419.py"]);
