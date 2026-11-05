import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd(), node = process.execPath, temporary = resolve(root, "dist/temp/v434");
mkdirSync(temporary, { recursive: true });
const env = { ...process.env, TEMP: temporary, TMP: temporary };
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v434 measured admission Python oracle", "python", ["scripts/run-kerr-high-energy-measured-admission-oracle-v434.py"]);
run("v434 measured admission TypeScript compiler", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-high-energy-measured-admission-v434.ts"]);
run("v434 measured admission FITS and firewall diagram", "python", ["scripts/export-kerr-high-energy-measured-admission-v434.py"]);
