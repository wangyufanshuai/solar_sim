import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd(), node = process.execPath, temporary = resolve(root, "dist/temp/v434"); mkdirSync(temporary, { recursive: true }); const env = { ...process.env, TEMP: temporary, TMP: temporary }; const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v434 measured admission chain", node, ["scripts/build-kerr-high-energy-measured-admission-chain-v434.mjs"]);
run("v434 evidence and capability pointer", node, ["scripts/build-shadow-candidate-v434.mjs"]);
