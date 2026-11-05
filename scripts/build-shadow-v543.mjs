import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const commands = [["python", ["scripts/build-kerr-replay-isolated-preflight-v543.py"], "isolated-authority"], ["python", ["-m", "pytest", "scripts/test-kerr-replay-isolated-preflight-v543.py", "-q", "-o", "asyncio_default_fixture_loop_scope=function"], "isolated-tests"], [process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-replay-isolated-preflight-runtime-v543.ts"], "runtime"]];
for (const [command, args, label] of commands) { const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" }); if (result.status !== 0) throw new Error(`v543-${label}-exit-${result.status}`); }
await import("./build-shadow-candidate-v543.mjs");
