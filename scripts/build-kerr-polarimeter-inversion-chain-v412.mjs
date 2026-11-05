import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = process.cwd(), node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v412 independent oracle", "python", ["scripts/run-kerr-polarimeter-inversion-oracle-v412.py"]);
run("v412 generalized inversion", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-polarimeter-inversion-v412.ts"]);
