import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd(), node = process.execPath;
const temporary = resolve(root, "dist/temp/v429");
mkdirSync(temporary, { recursive: true });
function run(label, command, args) { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env: { ...process.env, TEMP: temporary, TMP: temporary } }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); }
run("v429 complex-step response uncertainty Python oracle", "python", ["scripts/run-kerr-high-energy-response-uncertainty-oracle-v429.py"]);
run("v429 TypeScript forward operator and covariance compiler", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-high-energy-response-uncertainty-v429.ts"]);
run("v429 covariance FITS and uncertainty architecture", "python", ["scripts/export-kerr-high-energy-response-uncertainty-v429.py"]);
