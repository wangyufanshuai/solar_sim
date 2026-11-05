import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd(), node = process.execPath, temporary = resolve(root, "dist/temp/v431");
mkdirSync(temporary, { recursive: true });
const env = { ...process.env, TEMP: temporary, TMP: temporary };
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v431 fixed-seed likelihood stress Python oracle", "python", ["scripts/run-kerr-high-energy-likelihood-stress-oracle-v431.py"]);
run("v431 TypeScript stress discriminator", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-high-energy-likelihood-stress-v431.ts"]);
run("v431 stress FITS and routing map", "python", ["scripts/export-kerr-high-energy-likelihood-stress-v431.py"]);
