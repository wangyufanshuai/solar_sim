import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd(), node = process.execPath, temporary = resolve(root, "dist/temp/v435"); mkdirSync(temporary, { recursive: true }); const env = { ...process.env, TEMP: temporary, TMP: temporary }; const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v435 measured import Python contract oracle", "python", ["scripts/run-kerr-high-energy-measured-import-oracle-v435.py"]);
run("v435 measured import TypeScript builder", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-high-energy-measured-import-v435.ts"]);
