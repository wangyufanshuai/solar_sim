import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd(), node = process.execPath, temporary = resolve(root, "dist/temp/v432");
mkdirSync(temporary, { recursive: true });
const env = { ...process.env, TEMP: temporary, TMP: temporary };
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v432 synthetic alternative-likelihood Python authority oracle", "python", ["scripts/run-kerr-high-energy-likelihood-authority-oracle-v432.py"]);
run("v432 TypeScript authority compiler", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-high-energy-likelihood-authority-v432.ts"]);
run("v432 authority FITS and map", "python", ["scripts/export-kerr-high-energy-likelihood-authority-v432.py"]);
