import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

for (const [command, args, label] of [["python", ["scripts/build-kerr-response-aware-replay-kit-v541.py"], "replay-kit-authority"], ["python", ["-m", "pytest", "scripts/test-kerr-response-aware-replay-kit-v541.py", "-q", "-o", "asyncio_default_fixture_loop_scope=function"], "replay-kit-tests"], [process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-replay-kit-runtime-v541.ts"], "runtime"]]) { const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" }); if (result.status !== 0) throw new Error(`v541-${label}-exit-${result.status}`); }
await import("./build-shadow-candidate-v541.mjs");
