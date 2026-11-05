import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
for (const [command, args] of [["python", ["scripts/run-kerr-ideal-analyzer-sensitivity-v523.py"]], [process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-ideal-analyzer-sensitivity-runtime-v523.ts"]]]) { const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" }); if (result.status !== 0) throw new Error(`v523-build-exit-${result.status}:${command}`); }
await import("./build-shadow-candidate-v523.mjs");
