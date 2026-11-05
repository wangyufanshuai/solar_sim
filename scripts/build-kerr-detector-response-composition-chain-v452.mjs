import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd(); const temp = resolve(root, "dist/temp/v452"); mkdirSync(temp, { recursive: true });
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env: { ...process.env, TEMP: temp, TMP: temp } }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v452 TypeScript response fixture", process.execPath, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-detector-response-composition-fixture-v452.ts"]);
run("v452 Python Decimal response oracle", "python", ["scripts/run-kerr-detector-response-composition-oracle-v452.py"]);
run("v452 response composition qualification", process.execPath, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-detector-response-composition-v452.ts"]);
