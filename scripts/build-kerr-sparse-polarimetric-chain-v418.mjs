import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v418 sparse polarimetric product", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-sparse-polarimetric-product-v418.ts"]);
run("v418 FITS table and diagnostic PNG", "python", ["scripts/export-kerr-sparse-polarimetric-product-v418.py"]);
