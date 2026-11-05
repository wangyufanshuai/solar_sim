import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v422 independent double-angle orientation oracle", "python", ["scripts/run-kerr-orientation-basis-oracle-v422.py"]);
run("v422 TypeScript mask-aware orientation basis", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-orientation-basis-v422.ts"]);
run("v422 FITS orientation table and compass diagnostic", "python", ["scripts/export-kerr-orientation-basis-v422.py"]);
