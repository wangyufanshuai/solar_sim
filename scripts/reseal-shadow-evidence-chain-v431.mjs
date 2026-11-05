import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd(), node = process.execPath, temporary = resolve(root, "dist/temp/v431");
mkdirSync(temporary, { recursive: true });
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false, env: { ...process.env, TEMP: temporary, TMP: temporary } }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v431 likelihood stress chain", node, ["scripts/build-kerr-high-energy-likelihood-stress-chain-v431.mjs"]);
run("v431 evidence and capability pointer", node, ["scripts/build-shadow-candidate-v431.mjs"]);
