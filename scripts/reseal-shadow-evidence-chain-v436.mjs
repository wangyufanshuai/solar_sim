import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd(); const temporary = resolve(root, "dist/temp/v436"); mkdirSync(temporary, { recursive: true }); const env = { ...process.env, TEMP: temporary, TMP: temporary }; const run = (label, args) => { const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit", shell: false, env }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v436 oracle and artifact", [resolve(root, "scripts/build-kerr-observation-provenance-chain-v436.mjs")]);
run("v436 evidence and pointer", [resolve(root, "scripts/build-shadow-candidate-v436.mjs")]);
