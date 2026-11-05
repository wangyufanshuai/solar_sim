import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = process.cwd(), node = process.execPath; const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v423 independent predicted-Stokes admission oracle", "python", ["scripts/run-kerr-predicted-stokes-admission-oracle-v423.py"]);
run("v423 TypeScript predicted-Stokes WCS admission", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-predicted-stokes-admission-v423.ts"]);
run("v423 FITS table and sparse prediction diagnostic", "python", ["scripts/export-kerr-predicted-stokes-admission-v423.py"]);
