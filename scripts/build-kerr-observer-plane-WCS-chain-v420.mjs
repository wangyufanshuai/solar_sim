import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v420 independent Astropy WCS oracle", "python", ["scripts/run-kerr-observer-wcs-oracle-v420.py"]);
run("v420 TypeScript observer-plane WCS", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-observer-plane-WCS-v420.ts"]);
run("v420 FITS WCS table and grid diagnostic", "python", ["scripts/export-kerr-observer-plane-WCS-v420.py"]);
